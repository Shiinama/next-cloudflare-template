import { NextRequest, NextResponse } from 'next/server'

import { getCounterDO } from '@/lib/durabe'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  if (!action || !['increment', 'decrement', 'current'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const stub = getCounterDO()
  let data: any
  if (action === 'current') {
    data = await stub.getCounterValue()
  } else if (action === 'increment') {
    data = await stub.increment()
  } else if (action === 'decrement') {
    data = await stub.decrement()
  }

  return NextResponse.json(data)
}
