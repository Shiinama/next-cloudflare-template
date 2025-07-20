'use server'

import { eq } from 'drizzle-orm'

import { createDb } from '@/lib/db'
import { products } from '@/lib/db/schema'

// 获取所有激活的产品
export async function getActiveProducts() {
  const db = createDb()

  return await db.query.products.findMany({
    where: eq(products.active, true),
    orderBy: (products, { asc }) => [asc(products.price)]
  })
}

// 获取单个产品详情
export async function getProductById(productId: string) {
  const db = createDb()

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId)
  })

  if (!product) {
    throw new Error('Product not found')
  }

  return product
}
