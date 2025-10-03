import { and, eq } from 'drizzle-orm'

import { createDb } from '@/lib/db'
import { postTranslations } from '@/lib/db/schema'

interface TranslationResult {
  title: string
  description: string
  fullText: string
}

interface PostTranslateParams {
  postId: string
  content: string
  locale: string
  originalTitle: string
  originalDescription: string
  slug: string
  originalCoverImageUrl: string | null
}

// 提取标题和描述的通用函数
const extractTitleAndDescription = (
  content: string,
  originalTitle: string,
  originalDescription: string
): Pick<TranslationResult, 'title' | 'description'> => {
  const titleMatch = content.match(/^#\s*(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : originalTitle

  const contentAfterTitle = content.replace(/^#\s*.+$/m, '').trim()
  const firstParagraphMatch = contentAfterTitle.match(/^([^\n#]+)/)

  let description = originalDescription
  if (firstParagraphMatch) {
    const paragraph = firstParagraphMatch[1].trim()
    description = paragraph.length > 160 ? paragraph.substring(0, 157) + '...' : paragraph
  }

  return { title, description }
}

// 全角符号转半角符号的映射
const FULLWIDTH_TO_HALFWIDTH_MAP: Record<string, string> = {
  '＃': '#',
  '（': '(',
  '）': ')',
  '"': '"',
  '【': '[',
  '】': ']',
  '｛': '{',
  '｝': '}'
}

// 转换全角符号为半角符号
const normalizeText = (text: string): string => {
  return Object.entries(FULLWIDTH_TO_HALFWIDTH_MAP).reduce(
    (result, [fullwidth, halfwidth]) => result.replace(new RegExp(fullwidth, 'g'), halfwidth),
    text
  )
}

// 调用翻译API
const translateContent = async (content: string, locale: string, script = false): Promise<string | null> => {
  const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=en&tl=${locale}`

  const response = await fetch(translateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'q=' + encodeURIComponent(content)
  })

  if (!response.ok) {
    if (script) throw new Error(`Translation API error: ${response.status} ${response.statusText}`)
    return null
  }

  const data: Array<string[]> = await response.json()
  const translatedText = data[0]
    .map((item) => item[0])
    .join('')
    .trim()

  return normalizeText(translatedText)
}

export const postTranslate = async (
  { postId, slug, content, locale, originalTitle, originalDescription, originalCoverImageUrl }: PostTranslateParams,
  script = false
): Promise<TranslationResult> => {
  const db = createDb()

  // 如果是英文，直接返回原内容
  if (locale === 'en') {
    return {
      title: originalTitle,
      description: originalDescription,
      fullText: content
    }
  }

  // 检查数据库中是否已有该文章的该语言翻译
  const existingTranslation = await db
    .select()
    .from(postTranslations)
    .where(and(eq(postTranslations.postId, postId), eq(postTranslations.locale, locale)))
    .limit(1)

  if (existingTranslation.length > 0) {
    return {
      title: existingTranslation[0].title,
      description: existingTranslation[0].excerpt,
      fullText: existingTranslation[0].content
    }
  }

  // 如果没有翻译，进行翻译
  const translatedText = await translateContent(content, locale, script)

  if (translatedText) {
    const { title, description } = extractTitleAndDescription(translatedText, originalTitle, originalDescription)

    await db.insert(postTranslations).values({
      postId,
      locale,
      slug,
      content: translatedText,
      title,
      excerpt: description,
      coverImageUrl: originalCoverImageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return {
      title,
      description,
      fullText: translatedText
    }
  }

  // 如果翻译失败或数据库操作失败，返回原内容
  return {
    title: originalTitle,
    description: originalDescription,
    fullText: content
  }
}
