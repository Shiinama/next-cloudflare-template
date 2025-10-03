import { NextRequest, NextResponse } from 'next/server'

import { generateArticle } from '@/actions/ai-content'
import { auth } from '@/lib/auth'

interface RequestBody {
  keyword: string
}

export async function POST(request: NextRequest) {
  const u = await auth()
  if (!process.env.NEXT_PUBLIC_ADMIN_ID.split(',').includes(u?.user?.id ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body: RequestBody = await request.json()
    const { keyword } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const article = await generateArticle({ keyword })
    return NextResponse.json(article)
  } catch (error: any) {
    console.error('Error generating article:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate article' }, { status: 500 })
  }
}
