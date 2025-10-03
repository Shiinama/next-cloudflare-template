'use server'

import { and, count, desc, eq, SQL, sql } from 'drizzle-orm'

import { cloudflareTextToImage } from '@/actions/ai'
import { DEFAULT_LOCALE, locales } from '@/i18n/routing'
import { createAI } from '@/lib/ai'
import {
  ALL_LANGUAGES,
  mapToArticleDetail,
  mapToArticleListItem,
  type ArticleDetail,
  type PostRow,
  type PostTranslationRow
} from '@/lib/articles/article-helpers'
import { createDb } from '@/lib/db'
import { posts, postTranslations } from '@/lib/db/schema'
import {
  buildLikeSearch,
  calculateTotalPages,
  combineConditions,
  pushCondition,
  resolvePagination
} from '@/lib/db/sql-utils'
import { withOptionalField } from '@/lib/utils/object'
import { isDefined, normalizeNullable } from '@/lib/utils/value'

interface ArticleGenerationParams {
  keyword: string
  locale?: string
}

export type ArticleStatusFilter = 'all' | 'published' | 'draft'

interface ArticleFilters {
  language?: string
  search?: string
  status?: ArticleStatusFilter
}

interface GetPaginatedArticlesParams {
  locale?: string
  page?: number
  pageSize?: number
  filters?: ArticleFilters
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

export async function generateArticle({ keyword, locale = DEFAULT_LOCALE }: ArticleGenerationParams) {
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

export async function getPaginatedArticles({ locale, page = 1, pageSize = 10, filters }: GetPaginatedArticlesParams) {
  const database = createDb()

  const { page: currentPage, pageSize: itemsPerPage, offset } = resolvePagination({ page, pageSize })

  const languageFilter = filters?.language ?? locale
  const statusFilter: ArticleStatusFilter = filters?.status ?? 'all'
  const rawSearch = filters?.search?.trim() ?? ''
  const normalizedSearch = rawSearch.toLowerCase()
  const hasSearch = normalizedSearch.length > 0

  const buildPostSearchCondition = (): SQL | undefined =>
    hasSearch ? buildLikeSearch([posts.title, posts.slug, posts.excerpt], { value: normalizedSearch }) : undefined

  const buildTranslationSearchCondition = (): SQL | undefined =>
    hasSearch
      ? buildLikeSearch(
          [postTranslations.title, postTranslations.slug, postTranslations.excerpt, posts.title, posts.slug],
          { value: normalizedSearch }
        )
      : undefined

  const buildPostStatusCondition = (): SQL | undefined => {
    if (statusFilter === 'published') {
      return sql`${posts.publishedAt} IS NOT NULL`
    }
    if (statusFilter === 'draft') {
      return sql`${posts.publishedAt} IS NULL`
    }
    return undefined
  }

  const buildJoinedPostStatusCondition = (): SQL | undefined => {
    if (statusFilter === 'published') {
      return sql`${posts.publishedAt} IS NOT NULL`
    }
    if (statusFilter === 'draft') {
      return sql`${posts.publishedAt} IS NULL`
    }
    return undefined
  }

  const fetchPosts = async (limit?: number, queryOffset?: number) => {
    const conditions: SQL[] = []
    pushCondition(conditions, buildPostSearchCondition())
    pushCondition(conditions, buildPostStatusCondition())

    const whereCondition = combineConditions(conditions)

    const selectBase = database.select({ post: posts }).from(posts)
    const selectFiltered = whereCondition ? selectBase.where(whereCondition) : selectBase
    const selectOrdered = selectFiltered.orderBy(desc(posts.createdAt))
    const selectLimited = typeof limit === 'number' ? selectOrdered.limit(limit) : selectOrdered
    const selectPaginated = typeof queryOffset === 'number' ? selectLimited.offset(queryOffset) : selectLimited

    const countBase = database.select({ count: count() }).from(posts)
    const countQuery = whereCondition ? countBase.where(whereCondition) : countBase

    const [rows, countResult] = await Promise.all([selectPaginated, countQuery])
    const totalItems = countResult[0]?.count || 0

    const articles = rows.map(({ post }) => mapToArticleListItem(post))

    return { articles, totalItems }
  }

  const fetchTranslations = async (localeFilter?: string, limit?: number, queryOffset?: number) => {
    const conditions: SQL[] = []
    if (localeFilter) {
      conditions.push(eq(postTranslations.locale, localeFilter))
    }

    pushCondition(conditions, buildTranslationSearchCondition())
    pushCondition(conditions, buildJoinedPostStatusCondition())

    const whereCondition = combineConditions(conditions)

    const selectBase = database
      .select({ translation: postTranslations, post: posts })
      .from(postTranslations)
      .innerJoin(posts, eq(postTranslations.postId, posts.id))

    const selectFiltered = whereCondition ? selectBase.where(whereCondition) : selectBase
    const selectOrdered = selectFiltered.orderBy(desc(postTranslations.createdAt))
    const selectLimited = typeof limit === 'number' ? selectOrdered.limit(limit) : selectOrdered
    const selectPaginated = typeof queryOffset === 'number' ? selectLimited.offset(queryOffset) : selectLimited

    const countBase = database
      .select({ count: count() })
      .from(postTranslations)
      .innerJoin(posts, eq(postTranslations.postId, posts.id))

    const countQuery = whereCondition ? countBase.where(whereCondition) : countBase

    const [rows, countResult] = await Promise.all([selectPaginated, countQuery])
    const totalItems = countResult[0]?.count || 0

    const articles = rows.map(({ translation, post }) => mapToArticleListItem(post, translation))

    return { articles, totalItems }
  }

  if (languageFilter === ALL_LANGUAGES) {
    const [
      { articles: defaultArticles, totalItems: defaultTotal },
      { articles: translationArticles, totalItems: translationTotal }
    ] = await Promise.all([fetchPosts(), fetchTranslations(undefined)])

    const combinedArticles = [...defaultArticles, ...translationArticles].sort((a, b) => {
      const aDate = Number(a.createdAt ?? 0)
      const bDate = Number(b.createdAt ?? 0)
      return bDate - aDate
    })

    const totalItems = defaultTotal + translationTotal
    const paginatedArticles = combinedArticles.slice(offset, offset + itemsPerPage)
    const totalPages = calculateTotalPages(totalItems, itemsPerPage)

    return {
      articles: paginatedArticles,
      pagination: {
        currentPage,
        pageSize: itemsPerPage,
        totalItems,
        totalPages
      }
    }
  }

  const resolvedLocale = languageFilter ?? DEFAULT_LOCALE

  if (resolvedLocale === DEFAULT_LOCALE) {
    const { articles, totalItems } = await fetchPosts(itemsPerPage, offset)
    const totalPages = calculateTotalPages(totalItems, itemsPerPage)

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

  const { articles, totalItems } = await fetchTranslations(resolvedLocale, itemsPerPage, offset)
  const totalPages = calculateTotalPages(totalItems, itemsPerPage)

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

export async function getAllArticles(locale?: string) {
  const database = createDb()
  const resolvedLocale = locale ?? DEFAULT_LOCALE

  const rows = await database
    .select({
      post: posts,
      translation: postTranslations
    })
    .from(posts)
    .leftJoin(postTranslations, and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, resolvedLocale)))
    .orderBy(desc(posts.createdAt))

  return rows.map(({ post, translation }) => mapToArticleListItem(post, translation, { createdAtSource: 'post' }))
}

// 根据 slug 获取单篇文章
export async function getArticleBySlug(slug: string, locale: string = DEFAULT_LOCALE): Promise<ArticleDetail | null> {
  const database = createDb()

  const rows = await database
    .select({ post: posts, translation: postTranslations })
    .from(posts)
    .leftJoin(postTranslations, and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, locale)))
    .where(eq(posts.slug, slug))
    .limit(1)

  if (rows.length === 0) {
    return null
  }

  const { post, translation } = rows[0]

  return mapToArticleDetail(post, translation, locale)
}

// 更新文章
export async function updateArticle(
  slug: string,
  data: {
    locale?: string
    title?: string
    content?: string
    excerpt?: string
    coverImageUrl?: string | null
    publishedAt?: Date | null
    slug?: string
  }
) {
  const database = createDb()
  const targetLocale = data.locale ?? DEFAULT_LOCALE
  const now = new Date()

  const postResult = await database.select().from(posts).where(eq(posts.slug, slug)).limit(1)
  const post = postResult[0]

  if (!post) {
    throw new Error('Article not found')
  }

  if (targetLocale === DEFAULT_LOCALE) {
    const updatePayload: Partial<PostRow> = { updatedAt: now }

    withOptionalField(updatePayload, 'title', data.title)
    withOptionalField(updatePayload, 'content', data.content)
    withOptionalField(updatePayload, 'excerpt', data.excerpt)

    if (isDefined(data.coverImageUrl)) {
      updatePayload.coverImageUrl = normalizeNullable(data.coverImageUrl)
    }

    if (Object.prototype.hasOwnProperty.call(data, 'publishedAt')) {
      updatePayload.publishedAt = data.publishedAt ?? null
    }

    if (isDefined(data.slug) && data.slug.trim().length > 0 && data.slug !== post.slug) {
      updatePayload.slug = data.slug
    }

    await database.update(posts).set(updatePayload).where(eq(posts.id, post.id))

    const nextSlug = typeof updatePayload.slug === 'string' ? updatePayload.slug : slug
    return getArticleBySlug(nextSlug, DEFAULT_LOCALE)
  }

  const translationResult = await database
    .select()
    .from(postTranslations)
    .where(and(eq(postTranslations.postId, post.id), eq(postTranslations.locale, targetLocale)))
    .limit(1)

  const existingTranslation = translationResult[0]

  if (existingTranslation) {
    const updatePayload: Partial<PostTranslationRow> = { updatedAt: now }

    withOptionalField(updatePayload, 'title', data.title)
    withOptionalField(updatePayload, 'content', data.content)
    withOptionalField(updatePayload, 'excerpt', data.excerpt)

    if (isDefined(data.coverImageUrl)) {
      updatePayload.coverImageUrl = normalizeNullable(data.coverImageUrl)
    }

    if (isDefined(data.slug) && data.slug.trim().length > 0) {
      updatePayload.slug = data.slug
    }

    await database.update(postTranslations).set(updatePayload).where(eq(postTranslations.id, existingTranslation.id))

    return getArticleBySlug(slug, targetLocale)
  }

  await database.insert(postTranslations).values({
    postId: post.id,
    locale: targetLocale,
    slug: data.slug ?? post.slug,
    title: data.title ?? post.title,
    excerpt: data.excerpt ?? post.excerpt,
    content: data.content ?? post.content,
    coverImageUrl: normalizeNullable(data.coverImageUrl ?? post.coverImageUrl ?? null),
    createdAt: now,
    updatedAt: now
  })

  return getArticleBySlug(slug, targetLocale)
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
    coverImageUrl?: string
  },
  publishImmediately = true
) {
  const database = createDb()
  const now = new Date()
  const postId = crypto.randomUUID()

  await database.insert(posts).values({
    id: postId,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    coverImageUrl: article.coverImageUrl,
    publishedAt: publishImmediately ? now : undefined,
    createdAt: now,
    updatedAt: now
  })
}

export async function saveBatchArticles(
  articles: Array<{
    title: string
    slug: string
    content: string
    excerpt: string
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
        const now = new Date()
        const postId = crypto.randomUUID()

        await database.insert(posts).values({
          id: postId,
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          coverImageUrl: article.coverImageUrl,
          publishedAt: publishImmediately ? now : undefined,
          createdAt: now,
          updatedAt: now
        })

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
