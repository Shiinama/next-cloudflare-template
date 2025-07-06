'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { createDb } from '@/lib/db'
import {
  orders,
  subscriptions,
  transactions,
  userUsage,
  OrderStatus,
  PaymentMethod,
  SubscriptionStatus,
  TransactionType
} from '@/lib/db/schema'

import { getProductById } from './products'

const db = createDb()

// 创建新订单
export async function createOrder({ productId, paymentMethod }: { productId: string; paymentMethod: PaymentMethod }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  // 获取产品信息
  const product = await getProductById(productId)

  if (!product.active) {
    throw new Error('Product is not available')
  }

  // 创建订单
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      productId,
      amount: product.price,
      currency: product.currency,
      status: 'pending' as OrderStatus,
      paymentMethod
    })
    .returning()

  return order
}

// 处理订单支付成功
export async function handlePaymentSuccess({
  orderId,
  paymentIntentId,
  metadata
}: {
  orderId: string
  paymentIntentId?: string
  metadata?: string
}) {
  // 获取订单信息
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status === 'completed') {
    return order // 订单已经处理过
  }

  // 获取产品信息
  const product = await getProductById(order.productId)

  // 更新订单状态
  await db
    .update(orders)
    .set({
      status: 'completed' as OrderStatus,
      paymentIntentId,
      metadata,
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId))

  // 如果是订阅产品，创建订阅记录
  if (product.type === 'subscription') {
    const now = new Date()
    const currentPeriodEnd = new Date()

    // 根据订阅周期设置结束时间
    switch (product.interval) {
      case 'day':
        currentPeriodEnd.setDate(now.getDate() + 1)
        break
      case 'week':
        currentPeriodEnd.setDate(now.getDate() + 7)
        break
      case 'month':
        currentPeriodEnd.setMonth(now.getMonth() + 1)
        break
      case 'year':
        currentPeriodEnd.setFullYear(now.getFullYear() + 1)
        break
      default:
        throw new Error('Invalid subscription interval')
    }

    // 创建订阅记录
    await db.insert(subscriptions).values({
      userId: order.userId,
      productId: product.id,
      orderId: order.id,
      status: 'active' as SubscriptionStatus,
      currentPeriodStart: now,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      subscriptionId: paymentIntentId
    })
  }

  // 如果产品提供token，添加交易记录并更新用户token余额
  if (product.tokenAmount) {
    // 创建交易记录
    await db.insert(transactions).values({
      userId: order.userId,
      orderId: order.id,
      type: 'purchase' as TransactionType,
      amount: product.tokenAmount
    })

    // 获取用户当前使用情况
    const usage = await db.query.userUsage.findFirst({
      where: eq(userUsage.userId, order.userId)
    })

    if (usage) {
      // 更新现有记录
      await db
        .update(userUsage)
        .set({
          totalTokens: usage.totalTokens + product.tokenAmount
        })
        .where(eq(userUsage.userId, order.userId))
    } else {
      // 创建新记录
      await db.insert(userUsage).values({
        userId: order.userId,
        usedTokens: 0,
        totalTokens: product.tokenAmount
      })
    }
  }

  return await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  })
}

// 获取用户订单历史
export async function getUserOrderHistory() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return await db.query.orders.findMany({
    where: eq(orders.userId, session.user.id),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    with: {
      product: true
    }
  })
}
