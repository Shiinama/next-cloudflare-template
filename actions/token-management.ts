import { eq, sql } from 'drizzle-orm'

import { createDb } from '@/lib/db'
import { userUsage } from '@/lib/db/schema'

// 更新用户使用的 tokens
export async function updateUserTokenUsage(userId: string, tokensUsed: number) {
  const db = createDb()
  try {
    await db
      .update(userUsage)
      .set({
        usedTokens: sql`usedTokens + ${tokensUsed}`
      })
      .where(eq(userUsage.userId, userId))
  } catch (error) {
    console.error(`Failed to update token usage for user ${userId}:`, error)
    throw error
  }
}

// 检查用户是否有足够的 tokens
export async function hasEnoughTokens(userId: string, requiredTokens: number) {
  const db = createDb()
  try {
    const [usage] = await db.select().from(userUsage).where(eq(userUsage.userId, userId))

    if (!usage) return false

    const remainingTokens = usage.totalTokens - usage.usedTokens
    return remainingTokens >= requiredTokens
  } catch (error) {
    console.error(`Failed to check tokens for user ${userId}:`, error)
    return false
  }
}
