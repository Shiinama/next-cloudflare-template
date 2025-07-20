import { notFound } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import Footer from '@/components/footer'
import Header from '@/components/header'
import NextTopLoader from '@/components/top-loader'
import { Toaster } from '@/components/ui/sonner'
import { locales, routing } from '@/i18n/routing'

import type { Metadata, Viewport } from 'next'

import '../globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteInfo')

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL),
    title: {
      default: t('meta.title'),
      template: `%s | ${t('brandName')}`
    },
    description: t('meta.description'),
    icons: {
      icon: '/logo.svg'
    },
    authors: [{ name: 'Felix', url: 'https://github.com/Shiinama' }],
    creator: 'Felix',
    openGraph: {
      images: ['/logo.svg']
    },
    alternates: {
      languages: {
        'x-default': process.env.NEXT_PUBLIC_BASE_URL,
        ...Object.fromEntries(
          locales.map((locale) => [locale.code, `${process.env.NEXT_PUBLIC_BASE_URL}/${locale.code}`])
        )
      }
    }
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  const currentLocale = locales.find((l) => l.code === locale)

  return (
    <html lang={currentLocale?.code ?? 'en'} dir={currentLocale?.dir || 'ltr'} suppressHydrationWarning>
      <body className="antialiased">
        <NextTopLoader />
        <NextIntlClientProvider>
          <SessionProvider>
            <Header />
            <main className="mx-auto flex w-full max-w-(--breakpoint-xl) flex-1 flex-col px-2.5 py-8 md:px-20">
              {children}
            </main>
            <Footer />
          </SessionProvider>
          <Toaster richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
