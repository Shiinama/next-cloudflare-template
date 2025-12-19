import { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import * as NProgress from 'nprogress'
import { useCallback, useEffect, useMemo } from 'react'

import { useI18nRouter, usePathname } from '@/i18n/navigation'

export default function useRouter() {
  const router = useI18nRouter()
  const pathname = usePathname()

  useEffect(() => {
    NProgress.done()
  }, [pathname])
  const replace = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (href !== pathname) {
        NProgress.start()
      }
      router.replace(href, options)
    },
    [router, pathname]
  )

  const push = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (href !== pathname) {
        NProgress.start()
      }
      router.push(href, options)
    },
    [router, pathname]
  )

  const value = useMemo(
    () => ({
      ...router,
      replace,
      push
    }),
    [router, replace, push]
  )

  return value
}
