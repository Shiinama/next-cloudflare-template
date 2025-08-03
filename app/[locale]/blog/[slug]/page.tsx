import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getArticleBySlug } from '@/actions/ai-content'
import MarkdownRender from '@/components/markdown/mark-down-render'
import { formatDate } from '@/lib/utils'

interface PostSlugPageProps {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = true
export const revalidate = false

export async function generateMetadata({ params }: PostSlugPageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  const t = await getTranslations('blog')

  if (!article) {
    return {
      title: t('postNotFound'),
      description: t('postNotFoundDescription')
    }
  }

  return {
    title: article.title,
    description: article.excerpt
  }
}

const PostSlugPage = async ({ params }: PostSlugPageProps) => {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  const t = await getTranslations('blog')

  if (!article || !article.publishedAt) {
    notFound()
  }

  return (
    <article>
      <div className="text-sm">{t('publishedAt', { date: formatDate(article.publishedAt) })}</div>
      {article.coverImageUrl && (
        <div className="relative mb-16 w-full" style={{ paddingBottom: '56.25%' }}>
          <Image
            src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${article.coverImageUrl}`}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            className="absolute top-0 left-0 h-full w-full"
          />
        </div>
      )}
      <MarkdownRender content={article.content} />
    </article>
  )
}

export default PostSlugPage
