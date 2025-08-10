'use server'

import { count, desc, eq } from 'drizzle-orm'

import { cloudflareTextToImage } from '@/actions/ai'
import { locales } from '@/i18n/routing'
import { createAI } from '@/lib/ai'
import { createDb } from '@/lib/db'
import { posts, postTranslations } from '@/lib/db/schema'

interface ArticleGenerationParams {
  keyword: string
  locale?: string
}

export async function generateArticleCoverImage(articleContent: string, title: string) {
  const cloudflareAI = createAI()

  const promptGenerationResult = await cloudflareAI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating Stable Diffusion prompts. 
          
          Create a prompt for a 16:9 cover image that represents the article's main theme.
          
          Guidelines for the prompt:
          - Use a comma-separated list of keywords and short phrases
          - Include visual elements, style descriptors, and mood indicators
          - Focus on concrete visual elements rather than abstract concepts
          - Include 5-20 keywords maximum
          - DO NOT use full sentences or narrative descriptions
          - DO NOT include negative prompts
          - DO NOT include quotation marks or other formatting
          
          Example good prompts:
          - mountain landscape, sunrise, golden light, fog, dramatic vista, 16k
          - business meeting, professional setting, modern office, teamwork, corporate
          - healthy food, fresh vegetables, vibrant colors, wooden table, soft lighting`
      },
      {
        role: 'user',
        content: `Create a Stable Diffusion prompt for a cover image for an article titled: "${title}". 
          
          Here's the beginning of the article content for context: "${articleContent.substring(0, 500)}..."
          
          Return ONLY the comma-separated keywords without any explanation or additional text.`
      }
    ],
    stream: false
  })

  let imagePrompt = title
  if (typeof promptGenerationResult === 'object') {
    // Clean up the response to ensure it's just the keywords
    const response = promptGenerationResult.response.trim()
    // Remove any explanatory text, quotation marks, or other formatting
    imagePrompt = response
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^(prompt:|keywords:|here's a prompt:|stable diffusion prompt:)/i, '') // Remove prefixes
      .replace(/\.$/g, '') // Remove trailing period
      .trim()
  }

  // Generate the cover image using the created prompt
  const imageResult = await cloudflareTextToImage({
    prompt: imagePrompt,
    ratio: '16:9',
    style: 'cinematic', // Using cinematic style for professional-looking cover images
    steps: 12, // Higher quality generation
    negativePrompt: 'text, watermark, signature, blurry, distorted, low quality, disfigured'
  })

  return imageResult.imageUrl
}

function getLanguageNameFromLocale(localeCode: string): string {
  const locale = locales.find((l) => l.code === localeCode)
  if (locale) {
    return locale.name
  }
  return 'English'
}

export async function generateArticle({ keyword, locale = 'en' }: ArticleGenerationParams) {
  const languageName = getLanguageNameFromLocale(locale)

  const systemPrompt = `
  You are an SEO content writer. Your job is write blog post optimized for keyword, title and outline. Please use "keywords" as the keyword to search the first 20 search results on Google, and record their article structure and titles. Then, based on these contents, output an article that conforms to Google SEO logic and user experience. 

  Format requirements:
  - Start with a single H1 title (# Title) that is EXACTLY 50 characters or less
  - The title must include the main keyword and be compelling for readers
  - Use markdown formatting with proper heading structure (# for H1, ## for H2, etc.)
  - Include well-formatted paragraphs, lists, and other elements as appropriate
  - Maintain a professional, informative tone
  
  SEO requirements:
  - Make the first paragraph suitable for a meta description
  - Answer common user questions related to the topic in a conversational tone
  - Write in a natural, flowing style that mimics human writing patterns with varied sentence structures
  - Avoid obvious AI patterns like excessive lists and formulaic paragraph structures
  - Incorporate personal anecdotes, analogies, and relatable examples where appropriate
  - Include the most up-to-date information and recent developments on the topic
  - Ensure comprehensive coverage with sufficient depth (minimum 1500 words)
  
  Language requirement:
  - Write the entire article in ${languageName} language
  - Ensure the content is culturally appropriate for ${languageName}-speaking audiences
  - Use proper grammar, idioms, and expressions specific to ${languageName}
  ${locale === 'ar' ? '- Follow right-to-left (RTL) text conventions' : ''}
  
  IMPORTANT: At the very end of your response, include two separate sections:
  1. "META_DESCRIPTION:" followed by a concise, SEO-friendly excerpt (130-140 characters max) that includes the main keyword naturally.
  2. "URL_SLUG:" followed by an SEO-friendly URL slug for this article in ENGLISH ONLY (lowercase, words separated by hyphens, no special characters), regardless of the article language.
  
  Produce original, accurate, and valuable content of at least 10,000 tokens. Output the article content, starting with the H1 title, followed by the meta description and URL slug sections at the end.`

  const userPrompt = `Create an article about "${keyword}" in ${languageName} language. Optimize it for search engines while maintaining high-quality, valuable content for readers.`

  try {
    const cloudflareAI = createAI()

    const analysisResult = await cloudflareAI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      max_tokens: 16000
    })

    if (typeof analysisResult === 'object') {
      const fullResponse = analysisResult.response

      const metaDescriptionMatch = fullResponse.match(/META_DESCRIPTION:\s*([\s\S]*?)(?=URL_SLUG:|$)/)
      const excerpt = metaDescriptionMatch ? metaDescriptionMatch[1].trim() : ''

      const urlSlugMatch = fullResponse.match(/URL_SLUG:\s*([\s\S]+)$/)
      let slug = urlSlugMatch ? urlSlugMatch[1].trim() : ''

      let content = fullResponse
      if (metaDescriptionMatch) {
        content = content.replace(/META_DESCRIPTION:[\s\S]*$/, '').trim()
      }

      const titleMatch = content.match(/^#\s+(.+)$/m)
      const extractedTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Article'

      if (!slug) {
        slug = extractedTitle
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
      }

      const coverImageUrl = await generateArticleCoverImage(content, extractedTitle)

      return {
        title: extractedTitle,
        slug,
        content,
        coverImageUrl,
        excerpt: excerpt || content.substring(0, 140) + '...',
        locale
      }
    }
  } catch (error) {
    throw error
  }
}

export async function getPaginatedArticles({
  locale,
  page = 1,
  pageSize = 10
}: {
  locale?: string
  page?: number
  pageSize?: number
}) {
  const database = createDb()

  const currentPage = Math.max(1, page)
  const itemsPerPage = Math.max(1, pageSize)
  const offset = (currentPage - 1) * itemsPerPage

  if (!locale || locale === 'en') {
    const baseQuery = database.select().from(posts).orderBy(desc(posts.publishedAt))
    const query = baseQuery.where(eq(posts.locale, 'en'))
    const countQuery = database.select({ count: count() }).from(posts).where(eq(posts.locale, 'en'))

    const [articles, countResult] = await Promise.all([query.limit(itemsPerPage).offset(offset), countQuery])

    const totalItems = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      articles,
      pagination: {
        currentPage,
        pageSize: itemsPerPage,
        totalItems,
        totalPages
      }
    }
  } else {
    const baseQuery = database
      .select()
      .from(postTranslations)
      .where(eq(postTranslations.locale, locale))
      .orderBy(desc(postTranslations.createdAt)) // 使用翻译的创建时间排序

    const countQuery = database
      .select({ count: count() })
      .from(postTranslations)
      .where(eq(postTranslations.locale, locale))

    const [articles, countResult] = await Promise.all([baseQuery.limit(itemsPerPage).offset(offset), countQuery])

    const totalItems = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      articles,
      pagination: {
        currentPage,
        pageSize: itemsPerPage,
        totalItems,
        totalPages
      }
    }
  }
}

export async function getAllArticles(locale?: string) {
  const database = createDb()
  const query = database.select().from(posts).orderBy(desc(posts.publishedAt))

  if (locale) {
    return await query.where(eq(posts.locale, locale))
  }

  return await query
}

// 根据 slug 获取单篇文章
export async function getArticleBySlug(slug: string) {
  const database = createDb()
  const result = await database.select().from(posts).where(eq(posts.slug, slug))
  return result[0] || null
}

// 更新文章
export async function updateArticle(
  slug: string,
  data: {
    title?: string
    content?: string
    excerpt?: string
    publishedAt?: Date | null
    locale?: string
  }
) {
  const database = createDb()
  const updateData = {
    ...data,
    updatedAt: new Date()
  }

  await database.update(posts).set(updateData).where(eq(posts.slug, slug))

  // 返回更新后的文章
  return getArticleBySlug(slug)
}

// 删除文章
export async function deleteArticle(slug: string) {
  const database = createDb()
  await database.delete(posts).where(eq(posts.slug, slug))
  return { success: true }
}

// 将生成的文章保存到数据库
export async function saveGeneratedArticle(
  article: {
    title: string
    slug: string
    content: string
    excerpt: string
    locale?: string
    coverImageUrl?: string
  },
  publishImmediately = true
) {
  const database = createDb()

  // 准备文章数据
  const postData = {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    locale: article.locale || 'en',
    coverImageUrl: article.coverImageUrl,
    publishedAt: publishImmediately ? new Date() : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await database.insert(posts).values(postData)
}

export async function saveBatchArticles(
  articles: Array<{
    title: string
    slug: string
    content: string
    excerpt: string
    locale?: string
    coverImageUrl?: string
    selected?: boolean
  }>,
  publishImmediately = true
) {
  const database = createDb()
  const results = []

  const articlesToSave = articles.filter((article) => article.selected !== false)

  const batchSize = 10
  for (let i = 0; i < articlesToSave.length; i += batchSize) {
    const batch = articlesToSave.slice(i, i + batchSize)

    const savePromises = batch.map(async (article) => {
      try {
        const postData = {
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          locale: article.locale || 'en',
          coverImageUrl: article.coverImageUrl,
          publishedAt: publishImmediately ? new Date() : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await database.insert(posts).values(postData)
        return {
          title: article.title,
          status: 'success'
        }
      } catch (error) {
        return {
          title: article.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const batchResults = await Promise.all(savePromises)
    results.push(...batchResults)
  }

  return results
}
