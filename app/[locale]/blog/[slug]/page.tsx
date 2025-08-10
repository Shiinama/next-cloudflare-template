import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import MarkdownRender from '@/components/markdown/mark-down-render'
import { formatDate } from '@/lib/utils'

interface PostSlugPageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export const dynamicParams = true
export const revalidate = false

const fetchBlogData = async (
  slug: string,
  locale: string
): Promise<{
  title: string
  description: string
  fullText: string
  publishedAt: Date
  coverImageUrl: string
}> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const response = await fetch(`${baseUrl}/api/blog/${slug}?locale=${locale}`, {
    cache: 'force-cache'
  })

  if (!response.ok) {
    if (response.status === 404) {
      notFound()
    }
    throw new Error('Failed to fetch blog data')
  }

  return response.json()
}

export async function generateMetadata(props: PostSlugPageProps) {
  const { slug, locale } = await props.params
  const { title, description } = await fetchBlogData(slug, locale)

  return {
    title,
    description
  }
}

const PostSlugPage = async (props: PostSlugPageProps) => {
  const { slug, locale } = await props.params
  const { fullText: content, publishedAt, coverImageUrl, title } = await fetchBlogData(slug, locale)
  const t = await getTranslations('blog')

  if (!content) {
    notFound()
  }

  return (
    <article>
      <div className="text-sm">{t('publishedAt', { date: formatDate(publishedAt) })}</div>
      {coverImageUrl && (
        <div className="relative mb-16 w-full" style={{ paddingBottom: '56.25%' }}>
          <Image
            src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${coverImageUrl}`}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="absolute top-0 left-0 h-full w-full"
          />
        </div>
      )}
      <MarkdownRender content={content} />
    </article>
  )
}

export default PostSlugPage
