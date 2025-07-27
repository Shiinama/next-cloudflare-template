import { Zap } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import UpgradeChat from './upgrade-chat'

interface Plan {
  name: string
  price: number
  tokens?: number
  description: string
  features: string[]
}

interface PlanComponentProps {
  id: string
}

export function PlanComponent({ id }: PlanComponentProps) {
  const t = useTranslations('plan')
  const locale = useLocale()

  const PLAN_DATA: Record<string, Plan> = {
    '7fae5433-a091-4b8d-91c9-ec147f38170b': {
      name: t('light.name'),
      price: 4.99,
      tokens: 100000,
      description: t('light.description'),
      features: [t('light.features.0'), t('light.features.1'), t('light.features.2')]
    },
    'f3e24b3f-96ec-4e6e-b653-50425f940aab': {
      name: t('standard.name'),
      price: 14.99,
      tokens: 400000,
      description: t('standard.description'),
      features: [t('standard.features.0'), t('standard.features.1'), t('standard.features.2'), t('standard.features.3')]
    },
    'fd6d5795-853a-421a-ba6b-ea76332b49cf': {
      name: t('professional.name'),
      price: 39.99,
      tokens: 1200000,
      description: t('professional.description'),
      features: [
        t('professional.features.0'),
        t('professional.features.1'),
        t('professional.features.2'),
        t('professional.features.3'),
        t('professional.features.4')
      ]
    }
  }

  const currentPlan = PLAN_DATA[id]

  if (!currentPlan) {
    return (
      <div className="bg-card w-full max-w-sm rounded-lg border p-6">
        <p className="text-muted-foreground">{t('notFound')}</p>
      </div>
    )
  }

  const numberFormatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  })

  const { name, price, tokens, description, features } = currentPlan

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="mb-1 text-xl font-bold">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-muted-foreground ml-1">{t('priceUnit')}</span>
      </div>

      {/* Tokens */}
      {tokens && (
        <div className="mb-4 text-sm">
          <span className="text-muted-foreground">{t('tokens')}: </span>
          <span className="font-medium">{numberFormatter.format(tokens)}</span>
        </div>
      )}

      {/* Features */}
      <div className="mb-4">
        <div className="mb-2 flex items-center">
          <Zap className="text-primary mr-1 h-4 w-4" />
          <span className="text-sm font-medium">{t('featuresTitle')}</span>
        </div>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <span className="text-primary mr-2">✓</span>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <UpgradeChat product={id} />
    </div>
  )
}
