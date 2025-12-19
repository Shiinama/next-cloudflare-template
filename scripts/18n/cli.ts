import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { locales } from '@/i18n/routing'

import { translateMessages, TranslationMode, TranslationOptions, deleteKeysFromMessages } from './translate'

const noTranslates = ['siteInfo', 'footer.copyright']

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('mode', {
      alias: 'm',
      describe: '翻译模式',
      choices: ['keys', 'missing'] as TranslationMode[],
      default: 'missing' as TranslationMode
    })
    .option('locales', {
      alias: 'l',
      describe: '目标语言（逗号分隔）',
      type: 'string'
    })
    .option('keys', {
      alias: 'k',
      describe: '要翻译的键（逗号分隔，使用点表示法表示嵌套键）',
      type: 'string'
    })
    .option('no-translate', {
      alias: 'n',
      describe: '不需要翻译的键（逗号分隔，使用点表示法表示嵌套键）',
      type: 'string',
      default: noTranslates.join(',')
    })
    .option('list-locales', {
      describe: '列出可用的语言',
      type: 'boolean',
      default: false
    })
    .option('delete-keys', {
      alias: 'd',
      describe: '从所有语言文件中删除指定的键（逗号分隔，使用点表示法表示嵌套键）',
      type: 'string'
    })
    .help().argv

  // 如果请求列出语言
  if (argv['list-locales']) {
    console.log('可用语言:')
    locales.forEach((locale) => {
      console.log(`- ${locale.code}: ${locale.name}`)
    })
    return
  }

  // 如果请求删除键
  if (argv['delete-keys']) {
    const keysToDelete = argv['delete-keys'].split(',').map((k) => k.trim())

    if (keysToDelete.length === 0) {
      console.error('错误: 必须提供至少一个要删除的键')
      process.exit(1)
    }

    console.log(`将从所有语言文件中删除以下键: ${keysToDelete.join(', ')}`)
    console.log('警告: 此操作不可撤销！')

    // 这里可以添加一个确认提示，但为简单起见，我们直接执行
    try {
      const results = await deleteKeysFromMessages(keysToDelete)

      if (results.success) {
        console.log('\n删除结果:')
        console.log('====================')

        let totalDeleted = 0

        for (const locale in results.deletedKeys) {
          const deletedKeys = results.deletedKeys[locale]
          if (deletedKeys.length > 0) {
            console.log(`✅ ${locale}: 已删除 ${deletedKeys.length} 个键`)
            console.log(
              `   删除的键: ${
                deletedKeys.length > 5
                  ? `${deletedKeys.slice(0, 5).join(', ')}... (共${deletedKeys.length}个)`
                  : deletedKeys.join(', ')
              }`
            )
            totalDeleted += deletedKeys.length
          } else {
            console.log(`ℹ️ ${locale}: 未找到要删除的键`)
          }
        }

        for (const locale in results.errors) {
          console.log(`❌ ${locale}: ${results.errors[locale]}`)
        }

        console.log('\n摘要:')
        console.log(`总计删除: ${totalDeleted} 个键`)
      } else {
        console.error('删除操作失败:', results.error)
        process.exit(1)
      }

      return
    } catch (error) {
      console.error('删除脚本失败:', error)
      process.exit(1)
    }
  }

  // 解析目标语言
  const targetLocales = argv.locales ? argv.locales.split(',').map((l) => l.trim()) : undefined

  // 解析键
  const keys = argv.keys ? argv.keys.split(',').map((k) => k.trim()) : []

  // 解析不需要翻译的键
  const noTranslateKeys = argv['no-translate'] ? argv['no-translate'].split(',').map((k) => k.trim()) : []

  // 验证在'keys'模式下是否提供了键
  if (argv.mode === 'keys' && keys.length === 0) {
    console.error('错误: 使用"keys"模式时必须提供键')
    process.exit(1)
  }

  const options: TranslationOptions = {
    mode: argv.mode as TranslationMode,
    targetLocales,
    keys,
    noTranslateKeys
  }

  if (argv.mode === 'keys') {
    console.log(`要翻译的键: ${keys.join(', ')}`)
  }

  if (noTranslateKeys.length > 0) {
    console.log(`不需要翻译的键: ${noTranslateKeys.join(', ')}`)
  }

  try {
    const results = await translateMessages(options)

    console.log('\n翻译结果:')
    console.log('====================')

    let successCount = 0
    let failureCount = 0

    for (const result of results) {
      if (result.success) {
        console.log(`✅ ${result.locale}: ${result.message}`)
        if (result.translatedKeys && result.translatedKeys.length > 0) {
          console.log(
            `   翻译的键: ${
              result.translatedKeys.length > 5
                ? `${result.translatedKeys.slice(0, 5).join(', ')}... (共${result.translatedKeys.length}个)`
                : result.translatedKeys.join(', ')
            }`
          )
        }
        if (result.copiedKeys && result.copiedKeys.length > 0) {
          console.log(
            `   复制的键: ${
              result.copiedKeys.length > 5
                ? `${result.copiedKeys.slice(0, 5).join(', ')}... (共${result.copiedKeys.length}个)`
                : result.copiedKeys.join(', ')
            }`
          )
        }
        successCount++
      } else {
        console.log(`❌ ${result.locale}: ${result.error}`)
        failureCount++
      }
    }

    console.log('\n摘要:')
    console.log(`总计: ${results.length}, 成功: ${successCount}, 失败: ${failureCount}`)

    if (failureCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('翻译脚本失败:', error)
    process.exit(1)
  }
}

main()
