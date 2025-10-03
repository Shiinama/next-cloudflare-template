import { DEFAULT_LOCALE } from '@/i18n/routing'
import { postTranslations, posts } from '@/lib/db/schema'

export type PostRow = typeof posts.$inferSelect
export type PostTranslationRow = typeof postTranslations.$inferSelect

export const ALL_LANGUAGES = 'all'

export interface ArticleDetail {
  id: string
  postId: string
  translationId: string | null
  slug: string
  baseSlug: string
  locale: string
  defaultLocale: string
  isDefaultLocale: boolean
  title: string
  excerpt: string
  content: string
  coverImageUrl: string | null
  publishedAt: Date | number | null
  createdAt: Date | number
  updatedAt: Date | number | null
  baseArticle: {
    id: string
    slug: string
    title: string
    excerpt: string
    content: string
    coverImageUrl: string | null
    publishedAt: Date | number | null
    createdAt: Date | number
    updatedAt: Date | number | null
  }
}

export const mapToArticleDetail = (
  post: PostRow,
  translation: PostTranslationRow | null,
  locale: string
): ArticleDetail => {
  const isDefaultLocale = locale === DEFAULT_LOCALE || !translation
  const activeRecord: PostRow | PostTranslationRow = isDefaultLocale ? post : translation!

  return {
    id: post.id,
    postId: post.id,
    translationId: translation?.id ?? null,
    slug: (activeRecord.slug ?? post.slug) as string,
    baseSlug: post.slug,
    locale: isDefaultLocale ? DEFAULT_LOCALE : locale,
    defaultLocale: DEFAULT_LOCALE,
    isDefaultLocale,
    title: activeRecord.title,
    excerpt: activeRecord.excerpt,
    content: activeRecord.content,
    coverImageUrl: activeRecord.coverImageUrl ?? post.coverImageUrl ?? null,
    publishedAt: post.publishedAt ?? null,
    createdAt: post.createdAt,
    updatedAt: activeRecord.updatedAt ?? post.updatedAt ?? null,
    baseArticle: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl ?? null,
      publishedAt: post.publishedAt ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt ?? null
    }
  }
}

export const mapToArticleListItem = (
  post: PostRow,
  translation?: PostTranslationRow | null,
  options?: { createdAtSource?: 'post' | 'translation' }
) => ({
  id: translation?.id ?? post.id,
  postId: post.id,
  translationId: translation?.id ?? null,
  slug: translation?.slug ?? post.slug,
  title: translation?.title ?? post.title,
  excerpt: translation?.excerpt ?? post.excerpt,
  content: translation?.content ?? post.content,
  coverImageUrl: translation?.coverImageUrl ?? post.coverImageUrl ?? null,
  createdAt:
    options?.createdAtSource === 'post'
      ? (post.createdAt as Date | number)
      : ((translation?.createdAt ?? post.createdAt) as Date | number),
  publishedAt: post.publishedAt,
  locale: translation?.locale ?? DEFAULT_LOCALE
})
