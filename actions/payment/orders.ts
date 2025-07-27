'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { createDb } from '@/lib/db'
import {
  orders,
  subscriptions,
  transactions,
  userUsage,
  OrderStatus,
  PaymentMethod,
  TransactionType,
  users,
  Currency
} from '@/lib/db/schema'

import { getProductById } from './products'

export interface Order {
  productId: string
  paymentMethod: PaymentMethod | null
  userId: string
  id: string
  createdAt: Date
  updatedAt: Date
  currency: Currency
  amount: number
  status: OrderStatus
  paymentIntentId: string | null
  metadata: string | null
}

// 创建新订单
export async function createOrder({
  productId,
  paymentMethod,
  userId
}: {
  productId: string
  paymentMethod: PaymentMethod
  userId: string
}) {
  const db = createDb()

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
      status: 'pending',
      paymentMethod
    })
    .returning()

  return order
}

// 处理订单支付成功
export async function handlePaymentSuccess({
  order,
  paymentIntentId,
  metadata
}: {
  order: Order
  paymentIntentId?: string
  metadata?: string
}) {
  const db = createDb()

  // 获取产品信息
  const product = await getProductById(order.productId)

  // 更新订单状态
  await db
    .update(orders)
    .set({
      status: 'completed',
      paymentIntentId,
      metadata,
      updatedAt: new Date()
    })
    .where(eq(orders.id, order.id))

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

    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, order.userId), eq(subscriptions.productId, product.id))
    })

    if (existingSubscription) {
      // 更新现有订阅
      await db
        .update(subscriptions)
        .set({
          orderId: order.id,
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          subscriptionId: paymentIntentId || existingSubscription.subscriptionId,
          updatedAt: now
        })
        .where(eq(subscriptions.id, existingSubscription.id))
    } else {
      // 创建新订阅记录
      await db.insert(subscriptions).values({
        userId: order.userId,
        productId: product.id,
        orderId: order.id,
        currentPeriodStart: now,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        subscriptionId: paymentIntentId
      })
    }
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
    where: eq(orders.id, order.id)
  })
}

export async function findUserProfileByEmail(email: string) {
  const db = createDb()
  if (!email) {
    throw new Error('邮箱是必需的')
  }

  const userProfile = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  })

  return userProfile
}

export async function getUserOrder() {
  const db = createDb()
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, session?.user?.id)
  })

  return order
}
