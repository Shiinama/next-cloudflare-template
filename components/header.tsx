'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/locale-switcher'
import LoginHeader from '@/components/login/login-header'
import Logo from '@/components/logo'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export default function Header({ className }: { className?: string }) {
  const t = useTranslations('headers')

  const pcLinkStyle = 'text-foreground hover:text-primary group relative font-medium transition-colors'
  const mobileLinkStyle =
    'hover:bg-secondary flex items-center rounded-md px-3 py-3 text-lg font-medium transition-colors'

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/blogs', label: t('blogs') }
  ]

  return (
    <header
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur sm:px-6 lg:px-18',
        className
      )}
    >
      <nav className="hidden w-full items-center justify-between md:flex">
        <div className="flex items-center">
          <Logo />
          <div className="ml-12 flex space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={pcLinkStyle}>
                {link.label}
                <span className="bg-primary absolute -bottom-1 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <LocaleSwitcher />
          <LoginHeader />
        </div>
      </nav>

      <div className="flex w-full items-center justify-between gap-4 md:hidden">
        <Logo />
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <Menu className="size-6" />
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[280px] flex-col sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>{t('navigation')}</SheetTitle>
                <SheetDescription>{t('navigationDescription')}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className={mobileLinkStyle}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t pt-4">
                <LoginHeader />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
