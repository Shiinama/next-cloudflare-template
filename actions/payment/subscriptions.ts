'use server'

import { eq, and } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { createDb } from '@/lib/db'
import { orders, subscriptions, OrderStatus, SubscriptionStatus } from '@/lib/db/schema'

import { getProductById } from './products'

import { updateUserTokens } from '@/actions/payment/tokens'

const db = createDb()

// 处理订阅续费
export async function handleSubscriptionRenewal({
  subscriptionId,
  paymentIntentId
}: {
  subscriptionId: string
  paymentIntentId?: string
}) {
  // 获取订阅信息
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId)
  })

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  if (subscription.status !== 'active') {
    throw new Error('Subscription is not active')
  }

  // 获取产品信息
  const product = await getProductById(subscription.productId)

  // 创建新的订单记录
  const [order] = await db
    .insert(orders)
    .values({
      userId: subscription.userId,
      productId: subscription.productId,
      amount: product.price,
      currency: product.currency,
      status: 'completed' as OrderStatus,
      paymentMethod: 'credit_card', // 假设使用信用卡续费
      paymentIntentId
    })
    .returning()

  // 更新订阅周期
  const newPeriodStart = new Date(subscription.currentPeriodEnd)
  const newPeriodEnd = new Date(subscription.currentPeriodEnd)

  switch (product.interval) {
    case 'day':
      newPeriodEnd.setDate(newPeriodStart.getDate() + 1)
      break
    case 'week':
      newPeriodEnd.setDate(newPeriodStart.getDate() + 7)
      break
    case 'month':
      newPeriodEnd.setMonth(newPeriodStart.getMonth() + 1)
      break
    case 'year':
      newPeriodEnd.setFullYear(newPeriodStart.getFullYear() + 1)
      break
  }

  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.id, subscriptionId))

  // 如果产品提供token，添加交易记录并更新用户token余额
  if (product.tokenAmount) {
    await updateUserTokens({
      userId: subscription.userId,
      orderId: order.id,
      amount: product.tokenAmount,
      type: 'subscription_renewal'
    })
  }

  return order
}

// 取消订阅
export async function cancelSubscription({
  subscriptionId,
  cancelImmediately = false
}: {
  subscriptionId: string
  cancelImmediately?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // 获取订阅信息
  const subscription = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, session.user.id))
  })

  if (!subscription) {
    throw new Error('Subscription not found or access denied')
  }

  if (cancelImmediately) {
    // 立即取消订阅
    await db
      .update(subscriptions)
      .set({
        status: 'canceled' as SubscriptionStatus,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId))
  } else {
    // 在当前周期结束时取消
    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId))
  }

  return await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId)
  })
}

// 获取用户的活跃订阅
export async function getUserActiveSubscriptions() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  return await db.query.subscriptions.findMany({
    where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')),
    with: {
      product: true
    }
  })
}
