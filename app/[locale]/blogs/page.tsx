import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getPaginatedArticles } from '@/actions/ai-content'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { Link } from '@/i18n/navigation'
import { formatDate } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blogs')

  return {
    title: t('metaTitle'),
    description: t('metaDescription')
  }
}

export default async function BlogPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page } = await searchParams
  const currentPage = page ? parseInt(page) : 1
  const pageSize = 18

  const { articles, pagination } = await getPaginatedArticles({
    locale,
    page: currentPage,
    pageSize
  })

  const t = await getTranslations('blogs')

  const publishedArticles = articles.filter((article) => article.createdAt)

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold text-white">{t('pageTitle')}</h1>

      {publishedArticles.length === 0 ? (
        <p className="text-muted-foreground text-center">{t('noArticles')}</p>
      ) : (
        <>
          <div className="space-y-8">
            {publishedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="flex cursor-pointer items-center space-x-6"
              >
                {article.coverImageUrl && (
                  <div className="w-1/4">
                    <img
                      src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${article.coverImageUrl}`}
                      alt={article.title}
                      className="h-full w-full rounded-lg object-cover"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                <div className="w-3/4">
                  <h2 className="mb-1 text-xl font-semibold text-white">{article.title}</h2>
                  <p className="mb-2 text-sm text-gray-400">
                    {t('publishedAt', { date: formatDate(article.createdAt) })}
                  </p>
                  <p className="text-gray-300">{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <BlogPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
          </div>
        </>
      )}
    </div>
  )
}
