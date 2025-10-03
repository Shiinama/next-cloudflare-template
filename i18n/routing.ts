import { defineRouting } from 'next-intl/routing'

export const DEFAULT_LOCALE = 'en'

export const locales = [
  {
    code: 'en',
    name: 'English',
    dir: 'ltr'
  },
  {
    code: 'zh',
    name: '中文',
    dir: 'ltr'
  },
  {
    code: 'ja',
    name: '日本語',
    dir: 'ltr'
  },
  {
    code: 'ko',
    name: '한국어',
    dir: 'ltr'
  },
  {
    code: 'es',
    name: 'Español',
    dir: 'ltr'
  },
  {
    code: 'fr',
    name: 'Français',
    dir: 'ltr'
  },
  {
    code: 'de',
    name: 'Deutsch',
    dir: 'ltr'
  },
  {
    code: 'it',
    name: 'Italiano',
    dir: 'ltr'
  },
  {
    code: 'ru',
    name: 'Русский',
    dir: 'ltr'
  },
  {
    code: 'pt',
    name: 'Português',
    dir: 'ltr'
  },
  {
    code: 'ar',
    name: 'العربية',
    dir: 'rtl'
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    dir: 'ltr'
  }
]

export const routing = defineRouting({
  locales: locales.map((i) => i.code),
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed'
})
