import { useLocale, useTranslations } from 'next-intl'

import UpgradeChat from './upgrade-chat'

interface TokenPackage {
  name: string
  price: number
  tokens: number
}

interface TokenPackageProps {
  id: string
}

export function TokenPackage({ id }: TokenPackageProps) {
  const t = useTranslations('tokenPackage')
  const locale = useLocale()

  const TOKEN_PACKAGES_DATA: Record<string, TokenPackage> = {
    'fdf2240f-5e81-4f56-9ef1-9da446965827': {
      name: t('trial.name'),
      price: 2.99,
      tokens: 30000
    },
    '084c2ee1-1c5f-4c36-baae-b3b61bae6a12': {
      name: t('small.name'),
      price: 9.99,
      tokens: 150000
    },
    '61685d92-c00a-4424-aa5a-46be191d530d': {
      name: t('medium.name'),
      price: 24.99,
      tokens: 400000
    }
  }

  const currentPackage = TOKEN_PACKAGES_DATA[id]

  const numberFormatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  })

  const { name, price, tokens } = currentPackage

  return (
    <div className="bg-card/50 hover:bg-card/80 group hover:border-primary/50 border-border/50 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-6 whitespace-nowrap">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          ≈ {numberFormatter.format(tokens)} {t('tokensLabel')} {t('oneTime')}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-primary text-3xl font-bold">${price}</div>
        <UpgradeChat product={id} variant="compact" />
      </div>
    </div>
  )
}
