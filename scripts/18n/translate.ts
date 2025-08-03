/**
 * 国际化翻译核心功能
 * 使用AI模型自动翻译消息文件
 */
import fs from 'fs/promises'
import path from 'path'
import 'dotenv/config'

import { locales } from '@/i18n/routing'
import { extractKeys, findMissingKeys, deepMerge } from './utils'

/**
 * 翻译模式
 * - missing: 仅翻译缺失的键
 * - keys: 仅翻译指定的键
 */
export type TranslationMode = 'missing' | 'keys'

/**
 * 翻译选项
 */
export type TranslationOptions = {
  /** 翻译模式 */
  mode: TranslationMode
  /** 目标语言代码（如果未提供，则翻译所有语言） */
  targetLocales?: string[]
  /** 要翻译的键（仅在'keys'模式下使用） */
  keys?: string[]
  /** 使用的AI模型 */
  model?: string
  /** 不需要翻译的键列表（如品牌名、公司信息等） */
  noTranslateKeys?: string[]
}

/**
 * 翻译结果
 */
export type TranslationResult = {
  /** 翻译是否成功 */
  success: boolean
  /** 语言代码 */
  locale: string
  /** 成功消息 */
  message?: string
  /** 已翻译的键 */
  translatedKeys?: string[]
  /** 已复制但未翻译的键 */
  copiedKeys?: string[]
  /** 错误信息 */
  error?: string
}

export async function translateMessages(options: TranslationOptions): Promise<TranslationResult[]> {
  const {
    mode = 'missing',
    targetLocales,
    keys = [],
    model = '@cf/google/gemma-3-12b-it',
    noTranslateKeys = []
  } = options

  const results: TranslationResult[] = []

  try {
    // 读取英文消息文件作为源
    const messagesDir = path.join(process.cwd(), 'messages')
    const englishMessagesPath = path.join(messagesDir, 'en.json')
    const englishMessagesText = await fs.readFile(englishMessagesPath, 'utf-8')
    const englishMessages = JSON.parse(englishMessagesText)

    // 确定要翻译的语言
    const localesToTranslate = targetLocales
      ? locales.filter((l) => targetLocales.includes(l.code) && l.code !== 'en')
      : locales.filter((l) => l.code !== 'en')

    if (localesToTranslate.length === 0) {
      return [{ success: false, locale: 'all', error: '没有找到要翻译的目标语言' }]
    }

    // 根据模式确定要翻译的内容
    let sourceToTranslate: any
    let missingKeysByLocale: Record<string, string[]> = {}

    switch (mode) {
      case 'keys':
        if (keys.length === 0) {
          throw new Error('Keys模式需要至少一个要翻译的键')
        }
        // 过滤掉不需要翻译的键
        const keysToTranslate = keys.filter((key) => !noTranslateKeys.includes(key))
        sourceToTranslate = extractKeys(englishMessages, keysToTranslate)
        break

      case 'missing':
        // 收集所有语言的缺失键
        for (const locale of localesToTranslate) {
          let existingTranslations = {}
          const localeFilePath = path.join(messagesDir, `${locale.code}.json`)

          try {
            const existingContent = await fs.readFile(localeFilePath, 'utf-8')
            existingTranslations = JSON.parse(existingContent)
          } catch (err) {
            console.log(`未找到 ${locale.code} 的现有翻译，将创建新文件。`)
          }

          const missingKeys = findMissingKeys(englishMessages, existingTranslations)
          if (missingKeys.length > 0) {
            // 过滤掉不需要翻译的键，但保留它们用于后续处理
            missingKeysByLocale[locale.code] = missingKeys
          }
        }

        // 如果所有语言都没有缺失键，则提前返回
        if (Object.keys(missingKeysByLocale).length === 0) {
          return localesToTranslate.map((locale) => ({
            success: true,
            locale: locale.code,
            message: `${locale.name} 没有发现缺失的键`,
            translatedKeys: []
          }))
        }

        // 使用所有缺失键的并集作为源
        const allMissingKeys = [...new Set(Object.values(missingKeysByLocale).flat())]
        // 过滤掉不需要翻译的键
        const missingKeysToTranslate = allMissingKeys.filter((key) => !noTranslateKeys.includes(key))
        sourceToTranslate = extractKeys(englishMessages, missingKeysToTranslate)
        break
    }

    // 准备翻译内容
    let translationPayload: Record<string, any> = {}
    let translationNeeded = false
    // 记录每个语言不需要翻译的键
    let noTranslateKeysByLocale: Record<string, string[]> = {}

    if (mode === 'missing') {
      // 对于missing模式，为每种语言只包含它缺失的键
      for (const locale of localesToTranslate) {
        const localeCode = locale.code
        const missingKeys = missingKeysByLocale[localeCode] || []

        // 分离需要翻译和不需要翻译的键
        const keysToTranslate = missingKeys.filter((key) => !noTranslateKeys.includes(key))
        const keysNotToTranslate = missingKeys.filter((key) => noTranslateKeys.includes(key))

        // 记录不需要翻译的键
        if (keysNotToTranslate.length > 0) {
          noTranslateKeysByLocale[localeCode] = keysNotToTranslate
        }

        if (keysToTranslate.length > 0) {
          translationPayload[localeCode] = extractKeys(englishMessages, keysToTranslate)
          translationNeeded = true
        }
      }
    } else {
      // 对于keys模式，所有语言使用相同的源
      // 分离需要翻译和不需要翻译的键
      const keysToTranslate = keys.filter((key) => !noTranslateKeys.includes(key))
      const keysNotToTranslate = keys.filter((key) => noTranslateKeys.includes(key))

      for (const locale of localesToTranslate) {
        const localeCode = locale.code

        // 记录不需要翻译的键
        if (keysNotToTranslate.length > 0) {
          noTranslateKeysByLocale[localeCode] = keysNotToTranslate
        }

        if (keysToTranslate.length > 0) {
          translationPayload[localeCode] = extractKeys(englishMessages, keysToTranslate)
          translationNeeded = true
        }
      }
    }

    // 处理不需要翻译的键（直接从英文复制）
    for (const locale of localesToTranslate) {
      const localeCode = locale.code
      const keysNotToTranslate = noTranslateKeysByLocale[localeCode] || []

      if (keysNotToTranslate.length > 0) {
        // 读取现有翻译（如果有）
        let existingTranslations = {}
        const localeFilePath = path.join(messagesDir, `${localeCode}.json`)

        try {
          const existingContent = await fs.readFile(localeFilePath, 'utf-8')
          existingTranslations = JSON.parse(existingContent)
        } catch (err) {
          // 文件不存在，将创建新文件
        }

        // 从英文复制不需要翻译的键
        const untranslatedContent = extractKeys(englishMessages, keysNotToTranslate)
        const mergedContent = deepMerge(existingTranslations, untranslatedContent)

        // 写入文件
        await fs.writeFile(localeFilePath, JSON.stringify(mergedContent, null, 2), 'utf-8')

        // 如果没有需要翻译的内容，添加结果
        if (!translationPayload[localeCode]) {
          results.push({
            success: true,
            locale: localeCode,
            message: `${locale.name} 只有不需要翻译的内容`,
            translatedKeys: [],
            copiedKeys: keysNotToTranslate
          })
        }
      }
    }

    // 如果没有需要翻译的内容，提前返回
    if (!translationNeeded) {
      // 过滤掉已经处理过的语言
      const remainingLocales = localesToTranslate.filter((locale) => !results.some((r) => r.locale === locale.code))

      return [
        ...results,
        ...remainingLocales.map((locale) => ({
          success: true,
          locale: locale.code,
          message: `${locale.name} 没有需要翻译的内容`,
          translatedKeys: []
        }))
      ]
    }

    // 准备多语言翻译提示
    const languagesToTranslate = localesToTranslate
      .filter((l) => translationPayload[l.code]) // 只包含需要翻译的语言
      .map((l) => `${l.code}: ${l.name}`)

    const languageList = languagesToTranslate.join(', ')

    console.log(languageList, 'languageList')

    const prompt = `
    I need to translate JSON structures from English to multiple languages: ${languageList}.
    
    The input is a JSON object where each top-level key is a language code, and the value contains
    the specific messages that need to be translated for that language.
    
    Rules:
    1. Preserve all placeholders like {name}, {count}, etc.
    2. Maintain the exact same JSON structure for each language
    3. Only translate the values, not the keys
    
    Source JSON:
    ${JSON.stringify(translationPayload, null, 2)}
    
    Please respond with a JSON object with the same structure, where each language code contains its translated content.
    Return only the JSON without any additional text or explanations.
    `

    console.log(JSON.stringify(translationPayload, null, 2))

    // 调用AI模型进行批量翻译
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          stream: false,
          max_tokens: 13000
        })
      }
    )

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }

    const { result }: { result: { response: string } } = await response.json()

    console.log(result.response)

    // 提取JSON响应
    const jsonMatch = result.response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('响应中未找到有效的JSON')
    }

    const jsonString = jsonMatch[0]
    const allTranslations = JSON.parse(jsonString)

    // 处理每种语言的翻译结果
    for (const locale of localesToTranslate) {
      try {
        const localeCode = locale.code

        // 如果这个语言没有需要翻译的内容，跳过
        if (!translationPayload[localeCode]) {
          // 如果已经处理过不需要翻译的键，则跳过
          if (!results.some((r) => r.locale === localeCode)) {
            results.push({
              success: true,
              locale: localeCode,
              message: `${locale.name} 没有需要翻译的内容`,
              translatedKeys: []
            })
          }
          continue
        }

        const translatedContent = allTranslations[localeCode]

        if (!translatedContent) {
          results.push({
            success: false,
            locale: localeCode,
            error: `未找到 ${locale.name} 的翻译结果`
          })
          continue
        }

        // 读取现有翻译（如果有）
        let existingTranslations = {}
        const localeFilePath = path.join(messagesDir, `${localeCode}.json`)

        try {
          const existingContent = await fs.readFile(localeFilePath, 'utf-8')
          existingTranslations = JSON.parse(existingContent)
        } catch (err) {
          // 文件不存在，将创建新文件
        }

        // 确定最终内容
        let finalContent = deepMerge(existingTranslations, translatedContent)

        // 写入文件
        await fs.writeFile(localeFilePath, JSON.stringify(finalContent, null, 2), 'utf-8')

        // 确定哪些键被翻译了
        let translatedKeys: string[]
        if (mode === 'keys') {
          translatedKeys = keys.filter((key) => !noTranslateKeys.includes(key))
        } else {
          // missing mode
          translatedKeys = (missingKeysByLocale[localeCode] || []).filter((key) => !noTranslateKeys.includes(key))
        }

        // 获取已复制但未翻译的键
        const copiedKeys = noTranslateKeysByLocale[localeCode] || []

        results.push({
          success: true,
          locale: localeCode,
          message: `成功将 ${translatedKeys.length} 个键翻译为 ${locale.name}${copiedKeys.length > 0 ? `，并复制了 ${copiedKeys.length} 个不需要翻译的键` : ''}`,
          translatedKeys,
          copiedKeys
        })
      } catch (error) {
        console.error(`处理 ${locale.code} 时出错:`, error)
        results.push({
          success: false,
          locale: locale.code,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  } catch (error) {
    console.error('翻译过程失败:', error)
    return [
      {
        success: false,
        locale: 'all',
        error: error instanceof Error ? error.message : String(error)
      }
    ]
  }
}

/**
 * 从所有语言文件中删除指定的键
 * @param keys 要删除的键（使用点表示法表示嵌套键）
 * @returns 删除结果
 */
export async function deleteKeysFromMessages(keys: string[]): Promise<Record<string, any>> {
  if (!keys || keys.length === 0) {
    throw new Error('必须提供至少一个要删除的键')
  }

  const results: Record<string, any> = {
    success: true,
    deletedKeys: {},
    errors: {}
  }

  try {
    const messagesDir = path.join(process.cwd(), 'messages')

    // 获取所有JSON文件
    const files = await fs.readdir(messagesDir)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    for (const file of jsonFiles) {
      const locale = file.replace('.json', '')
      results.deletedKeys[locale] = []

      try {
        const filePath = path.join(messagesDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const messages = JSON.parse(content)

        let modified = false

        // 尝试删除每个键
        for (const key of keys) {
          const deleted = removeKey(messages, key)
          if (deleted) {
            modified = true
            results.deletedKeys[locale].push(key)
          }
        }

        // 如果有修改，写回文件
        if (modified) {
          await fs.writeFile(filePath, JSON.stringify(messages, null, 2), 'utf-8')
        }
      } catch (error) {
        results.success = false
        results.errors[locale] = error instanceof Error ? error.message : String(error)
      }
    }

    return results
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deletedKeys: {},
      errors: {}
    }
  }
}

function removeKey(obj: any, key: string): boolean {
  const parts = key.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] == null) {
      return false
    }
    current = current[part]
  }
  const lastPart = parts[parts.length - 1]
  if (current[lastPart] != null) {
    delete current[lastPart]
    return true
  }
  return false
}
