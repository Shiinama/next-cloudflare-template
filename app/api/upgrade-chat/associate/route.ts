import { NextRequest, NextResponse } from 'next/server'

import { createOrder, findUserProfileByEmail, handlePaymentSuccess } from '@/actions/payment/orders'
import { generateAuthorizationTokens, getEventDetail, verifyWebhookEvent } from '@/lib/upgrade-chat-client'

export async function POST(request: NextRequest) {
  const body: {
    id?: string
    webhook_id?: string
  } = await request.json()

  const { id: eventId, webhook_id: webhookId } = body

  if (!eventId || !webhookId) {
    return NextResponse.json({ error: 'event_id is require!' }, { status: 400 })
  }

  const token = await generateAuthorizationTokens()

  if (token) {
    const valid = await verifyWebhookEvent(eventId, token.access_token)
    if (valid) {
      const { data } = await getEventDetail(eventId, token.access_token)
      const body = data.body
      body.user.email = '2072738187yu@gmail.com'

      if (body.user.email) {
        const user = await findUserProfileByEmail(body.user.email)

        if (user) {
          switch (data.type) {
            case 'order.created':
            case 'order.updated':
              const order = await createOrder({
                productId: body.order_items[0].product.uuid,
                paymentMethod: 'upgrade.chat',
                userId: user.id
              })

              if (!order) {
                console.error('Create Order Failed:', body.uuid)
                return NextResponse.json({ error: 'Create Order Failed!' }, { status: 500 })
              }

              if (order.status === 'completed') {
                console.error('Order already completed:', body.uuid)
                return NextResponse.json({ error: 'Order already completed!' }, { status: 500 })
              }
              await handlePaymentSuccess({
                order,
                paymentIntentId: body.uuid,
                metadata: JSON.stringify(body)
              })
              return NextResponse.json({ message: 'Order Created!' }, { status: 200 })

            case 'order.deleted':
              console.error('Order deleted:', body.uuid)
              break

            default:
              console.error('Unknown event type:', data.type)
              break
          }
        }
      }

      return NextResponse.json({ message: 'User not found!' }, { status: 404 })
    }
  }
}
