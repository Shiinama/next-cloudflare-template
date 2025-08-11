import { getAllArticles } from '@/actions/ai-content'
import { locales } from '@/i18n/routing'

import type { MetadataRoute } from 'next'

export async function generateSitemaps() {
  return locales.map((locale) => ({
    id: locale.code
  }))
}

export default async function sitemap({ id: locale }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const routes = ['', '/blogs', '/voice', '/voice-design', '/blogs']

  const entries: MetadataRoute.Sitemap = []

  for (const route of routes) {
    entries.push({
      url: `${baseUrl}${locale === 'en' ? '' : `/${locale}`}${route}`
    })
  }

  const allArticles = await getAllArticles(locale)

  const publishedArticles = allArticles.map((article) => ({
    url: `${baseUrl}${locale === 'en' ? '' : `/${locale}`}/blog/${article.slug}`
  }))

  return [...entries, ...publishedArticles]
}
