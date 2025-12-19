'use client'

import { Check, Globe } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Locale, useLocale } from 'next-intl'
import { startTransition } from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'
import useRouter from '@/hooks/use-router'
import { usePathname } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'

type Props = {
  defaultValue: string
}

export function LocaleSwitcherSelect({ defaultValue }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const params = useParams()

  function onLocaleSelect(locale: Locale) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale }
      )
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? <Globe className="size-5 md:size-6" /> : <Button variant="outline">{defaultValue}</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            className="flex items-center justify-between"
            onClick={() => onLocaleSelect(locale.code)}
          >
            <span>{locale.name}</span>
            {defaultValue === locale.name && <Check className="ml-2 size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LocaleSwitcher() {
  const locale = useLocale()

  const name = locales.find((i) => i.code === locale)?.name ?? 'Unknown'

  return <LocaleSwitcherSelect defaultValue={name} />
}
