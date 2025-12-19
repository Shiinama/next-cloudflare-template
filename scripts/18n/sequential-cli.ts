import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { sequentialTranslate } from './sequential-translate'

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('locales', {
      alias: 'l',
      describe: '目标语言（逗号分隔）',
      type: 'string'
    })
    .option('no-translate', {
      alias: 'n',
      describe: '不需要翻译的键（逗号分隔，使用点表示法表示嵌套键）',
      type: 'string',
      default:
        'siteInfo.brandName,footer.quickLinks.craveUAI,footer.quickLinks.craveUAIPr,footer.quickLinks.craveUAICreatorBenefit'
    })
    .help().argv

  // 解析目标语言
  const targetLocales = argv.locales ? argv.locales.split(',').map((l) => l.trim()) : undefined

  // 解析不需要翻译的键
  const noTranslateKeys = argv['no-translate'] ? argv['no-translate'].split(',').map((k) => k.trim()) : []

  console.log('开始顺序翻译过程...')
  if (targetLocales) {
    console.log(`目标语言: ${targetLocales.join(', ')}`)
  } else {
    console.log('将翻译所有支持的语言')
  }

  if (noTranslateKeys.length > 0) {
    console.log(`不需要翻译的键: ${noTranslateKeys.join(', ')}`)
  }

  try {
    await sequentialTranslate({
      targetLocales,
      noTranslateKeys
    })
    console.log('顺序翻译脚本完成')
  } catch (error) {
    console.error('顺序翻译脚本失败:', error)
    process.exit(1)
  }
}

main()
