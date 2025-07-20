'use server'

import { eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { createDb } from '@/lib/db'
import { transactions, userUsage, TransactionType } from '@/lib/db/schema'

// 使用token
export async function updateUserTokenUsage({ amount }: { amount: number }) {
  const db = createDb()
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  // 获取用户当前使用情况
  const usage = await db.query.userUsage.findFirst({
    where: eq(userUsage.userId, userId)
  })

  if (!usage) {
    throw new Error('No token balance found for user')
  }

  const availableTokens = usage.totalTokens - usage.usedTokens

  if (availableTokens < amount) {
    throw new Error('Insufficient token balance')
  }

  // 创建交易记录（使用负数表示消费）
  await db.insert(transactions).values({
    userId,
    type: 'usage' as TransactionType,
    amount: -amount // 负数表示消费
  })

  // 更新用户已使用的token数量
  await db
    .update(userUsage)
    .set({
      usedTokens: usage.usedTokens + amount
    })
    .where(eq(userUsage.userId, userId))

  return {
    success: true,
    remainingTokens: availableTokens - amount
  }
}

export async function hasEnoughTokens(requiredTokens: number) {
  const db = createDb()
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  const usage = await db.query.userUsage.findFirst({
    where: eq(userUsage.userId, userId)
  })

  if (!usage) {
    return false
  }

  const remainingTokens = usage.totalTokens - usage.usedTokens

  return remainingTokens >= requiredTokens
}

// 获取用户token余额
export async function getUserTokenBalance() {
  const db = createDb()
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  const usage = await db.query.userUsage.findFirst({
    where: eq(userUsage.userId, userId)
  })

  if (!usage) {
    return {
      totalTokens: 0,
      usedTokens: 0,
      availableTokens: 0
    }
  }

  return {
    totalTokens: usage.totalTokens,
    usedTokens: usage.usedTokens,
    availableTokens: usage.totalTokens - usage.usedTokens
  }
}
