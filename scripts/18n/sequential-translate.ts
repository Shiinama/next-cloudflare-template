import fs from 'fs/promises'
import path from 'path'

import 'dotenv/config'
import { locales } from '@/i18n/routing'

import { translateMessages, TranslationOptions } from './translate'

/**
 * 递归查找缺失或空值的键
 * @param source 源对象（通常是英文消息）
 * @param target 目标对象（通常是其他语言消息）
 * @param prefix 当前路径前缀
 * @returns 缺失或空值键的数组（点表示法）
 */
function findMissingOrEmptyKeys(source: Record<string, any>, target: Record<string, any>, prefix = ''): string[] {
  const missingOrEmptyKeys: string[] = []

  for (const key in source) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    const sourceValue = source[key]

    if (!(key in target)) {
      // 键完全缺失
      if (typeof sourceValue === 'object' && sourceValue !== null) {
        // 如果是对象，递归添加所有叶子节点
        const leafKeys = extractAllKeys(sourceValue, currentPath)
        missingOrEmptyKeys.push(...leafKeys)
      } else {
        // 如果是叶子节点，直接添加
        missingOrEmptyKeys.push(currentPath)
      }
    } else {
      const targetValue = target[key]

      if (typeof sourceValue === 'object' && sourceValue !== null) {
        if (typeof targetValue !== 'object' || targetValue === null) {
          // 类型不匹配：源是对象，但目标不是
          // 添加所有叶子节点而不是父节点
          const leafKeys = extractAllKeys(sourceValue, currentPath)
          missingOrEmptyKeys.push(...leafKeys)
        } else {
          // 递归检查嵌套对象
          const nestedMissing = findMissingOrEmptyKeys(sourceValue, targetValue, currentPath)
          missingOrEmptyKeys.push(...nestedMissing)
        }
      } else if (
        // 检查空值或类型不匹配的情况
        targetValue === '' ||
        targetValue === null ||
        targetValue === undefined ||
        typeof sourceValue !== typeof targetValue
      ) {
        missingOrEmptyKeys.push(currentPath)
      }
    }
  }

  return missingOrEmptyKeys
}

/**
 * 递归提取所有键（使用点表示法）
 * @param obj 对象
 * @param prefix 前缀
 * @returns 键数组
 */
function extractAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = []

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = [...keys, ...extractAllKeys(obj[key], newKey)]
    } else {
      keys.push(newKey)
    }
  }

  return keys
}

/**
 * 顺序翻译所有键
 * @param options 翻译选项
 */
export async function sequentialTranslate(options: Omit<TranslationOptions, 'mode' | 'keys'> = {}): Promise<void> {
  try {
    // 读取英文消息文件（作为基准）
    const messagesDir = path.join(process.cwd(), 'messages')
    const englishMessagesPath = path.join(messagesDir, 'en.json')
    const englishMessagesText = await fs.readFile(englishMessagesPath, 'utf-8')
    const englishMessages = JSON.parse(englishMessagesText)

    // 确定要翻译的目标语言
    const { targetLocales } = options
    const localesToTranslate = targetLocales
      ? locales.filter((l) => targetLocales.includes(l.code) && l.code !== 'en')
      : locales.filter((l) => l.code !== 'en')

    if (localesToTranslate.length === 0) {
      console.log('没有找到要翻译的目标语言')
      return
    }

    // 提取英文文件中的所有键
    const allKeys = extractAllKeys(englishMessages)
    console.log(`英文文件中共有 ${allKeys.length} 个键`)

    let allMissingKeys: string[] = []

    console.log('开始检查各语言文件中缺失的键...')
    for (const locale of localesToTranslate) {
      const localeFilePath = path.join(messagesDir, `${locale.code}.json`)

      // 检查目标语言文件是否存在
      let existingTranslations = {}
      let fileExists = true

      try {
        const existingContent = await fs.readFile(localeFilePath, 'utf-8')
        try {
          existingTranslations = JSON.parse(existingContent)
        } catch {
          console.log(`⚠️ ${locale.code} 文件解析失败，将视为空文件`)
          fileExists = false
        }
      } catch {
        console.log(`⚠️ 未找到 ${locale.code} 的现有翻译文件，将创建新文件`)
        fileExists = false
      }

      // 确定缺失的键
      let missingKeys: string[] = []

      if (!fileExists || Object.keys(existingTranslations).length === 0) {
        // 如果文件不存在或为空，则所有键都是缺失的
        missingKeys = [...allKeys]
        console.log(`📝 ${locale.code}: 需要翻译所有 ${missingKeys.length} 个键`)
      } else {
        // 递归查找缺失的键
        missingKeys = findMissingOrEmptyKeys(englishMessages, existingTranslations)
        if (missingKeys.length > 0) {
          console.log(`📝 ${locale.code}: 需要翻译 ${missingKeys.length} 个键`)
        } else {
          console.log(`✅ ${locale.code}: 已包含所有键，无需翻译`)
        }
      }

      // 记录这个语言的缺失键
      if (missingKeys.length > 0) {
        allMissingKeys = [...new Set([...allMissingKeys, ...missingKeys])]
      }
    }

    // 如果没有缺失的键，提前结束
    if (allMissingKeys.length === 0) {
      console.log('✨ 所有语言文件都已包含所有键，无需翻译')
      return
    }

    console.log(`\n总共发现 ${allMissingKeys.length} 个不同的键需要翻译`)

    // 设置批次大小和分批
    const batchSize = 3 // 每批处理一个键，可以根据需要调整
    const batches = []

    // 将键分成批次
    for (let i = 0; i < allMissingKeys.length; i += batchSize) {
      batches.push(allMissingKeys.slice(i, i + batchSize))
    }

    console.log(`将分 ${batches.length} 批进行翻译\n`)

    // 顺序翻译每个批次
    let successCount = 0
    let failureCount = 0
    let skippedCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`🔄 开始翻译批次 ${i + 1}/${batches.length}，包含键: ${batch.join(', ')}`)

      const translationOptions: TranslationOptions = {
        mode: 'keys',
        keys: batch,
        ...options
      }

      try {
        const results = await translateMessages(translationOptions)

        // 处理结果
        for (const result of results) {
          if (result.success) {
            if (result.translatedKeys && result.translatedKeys.length > 0) {
              console.log(`✅ ${result.locale}: ${result.message}`)
              successCount += result.translatedKeys.length
            } else if (result.message?.includes('没有需要翻译的内容')) {
              console.log(`ℹ️ ${result.locale}: ${result.message}`)
              skippedCount += batch.length
            }
          } else {
            console.log(`❌ ${result.locale}: ${result.error}`)
            failureCount += batch.length
          }
        }
      } catch (error) {
        console.error(`❌ 批次 ${i + 1} 翻译失败:`, error)
        failureCount += batch.length
      }
    }

    console.log('\n✨ 翻译完成!')
    console.log('====================')
    console.log(`📊 总计键数: ${allKeys.length}`)
    console.log(`✅ 成功翻译: ${successCount}`)
    console.log(`⏭️ 跳过翻译: ${skippedCount}`)
    console.log(`❌ 失败翻译: ${failureCount}`)
  } catch (error) {
    console.error('❌ 顺序翻译过程失败:', error)
    throw error
  }
}
