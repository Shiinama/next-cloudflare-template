import { NextRequest, NextResponse } from 'next/server'

import { getArticleBySlug } from '@/actions/ai-content'
import { postTranslate } from '@/actions/post-translate'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const script = Boolean(searchParams.get('script'))

    const article = await getArticleBySlug(slug)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const data = await postTranslate(
      {
        postId: article.id,
        content: article.content,
        slug: slug,
        locale,
        originalTitle: article.title,
        originalDescription: article.excerpt,
        originalCoverImageUrl: article.coverImageUrl
      },
      script
    )

    return NextResponse.json({
      ...article,
      ...data
    })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
