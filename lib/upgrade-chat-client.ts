'use server'

import { Buffer } from 'buffer'

// 定义 UpgradeChat 事件类型
export type UpgradeChatEventType = 'order.created' | 'order.updated' | 'order.deleted'

// 定义 UpgradeChat 用户信息
export interface UpgradeChatUser {
  email: string
  discordId?: string
}

// 定义 UpgradeChat 产品信息
export interface UpgradeChatProduct {
  uuid: string
  name: string
}

// 定义 UpgradeChat 订单项
export interface UpgradeChatOrderItem {
  product: UpgradeChatProduct
}

export interface UpgradeChatEventDetail {
  data: {
    id: string
    body: {
      type: 'UPGRADE' | 'SHOP'
      user: {
        username: string
        discord_id?: string
        email?: string
      }
      uuid: string
      total: number
      discount?: number
      subtotal?: number
      order_items: Array<{
        price: number
        product: {
          name: string
          uuid: string
        }
        interval?: string
        quantity: number
        discord_roles?: Array<{
          name: string
          discord_id: string
        }>
        product_types?: string[]
        interval_count?: number
        is_time_limited?: boolean
        free_trial_length?: number
        payment_processor?: string
        payment_processor_record_id?: string
      }>
      cancelled_at: string | null
      purchased_at: string
      is_subscription: boolean
      payment_processor?: string
      payment_processor_record_id?: string
    }
    type: UpgradeChatEventType
    attempts: number
    webhook_id: string
  }
}

// UpgradeChat 授权令牌接口
export interface UpgradeChatAuthorizationTokens {
  access_token: string
  refresh_token: string
  refresh_token_expires_in: string
  access_token_expires_in: string
  type: string
  token_type: string
}

/**
 * 生成授权令牌
 * @param clientKey 客户端密钥
 * @param clientSecret 客户端密钥
 * @returns 授权令牌
 */
export async function generateAuthorizationTokens(
  clientKey: string = process.env.UPGRADE_CHAT_CLIENT_KEY || '',
  clientSecret: string = process.env.UPGRADE_CHAT_CLIENT_SECRET || ''
): Promise<UpgradeChatAuthorizationTokens> {
  // 创建基本认证字符串
  const authStr = `${clientKey}:${clientSecret}`
  const encodeAuthStr = Buffer.from(authStr).toString('base64')
  const authToken = `Basic ${encodeAuthStr}`

  // 准备请求参数
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')

  try {
    // 发送请求获取令牌
    const response = await fetch('https://api.upgrade.chat/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`状态码: ${response.status}, ${errorText}`)
    }

    // 解析响应
    const authorizationTokens: UpgradeChatAuthorizationTokens = await response.json()
    return authorizationTokens
  } catch (error) {
    console.error('获取 UpgradeChat 授权令牌失败:', error)
    throw new Error(`获取授权令牌失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 验证 Webhook 事件
 * @param eventId 事件 ID
 * @param token 授权令牌
 * @returns 事件是否有效
 */
export async function verifyWebhookEvent(eventId: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.upgrade.chat/v1/webhook-events/${eventId}/validate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`状态码: ${response.status}, ${errorText}`)
    }

    const {
      valid
    }: {
      valid: boolean
    } = await response.json()
    return valid
  } catch (error) {
    console.error('验证 UpgradeChat Webhook 事件失败:', error)
    throw new Error(`验证事件失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 获取事件详情
 * @param eventId 事件 ID
 * @param token 授权令牌
 * @returns 事件详情
 */
export async function getEventDetail(eventId: string, token: string): Promise<UpgradeChatEventDetail> {
  try {
    const response = await fetch(`https://api.upgrade.chat/v1/webhook-events/${eventId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`状态码: ${response.status}, ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取 UpgradeChat 事件详情失败:', error)
    throw new Error(`获取事件详情失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
