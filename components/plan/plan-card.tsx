import { Zap } from 'lucide-react'

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

const PLAN_DATA: Record<string, Plan> = {
  '7fae5433-a091-4b8d-91c9-ec147f38170b': {
    name: 'Light Plan',
    price: 4.99,
    tokens: 100000,
    description: 'Perfect for light usage and testing',
    features: ['Unlimited content creation', 'Flow tokens', 'Access to Flow community']
  },
  'f3e24b3f-96ec-4e6e-b653-50425f940aab': {
    name: 'Standard Plan',
    price: 14.99,
    tokens: 400000,
    description: 'Great for regular users and small teams',
    features: ['Unlimited content creation', 'Flow tokens', 'Access to Flow community', 'High-quality images']
  },
  'fd6d5795-853a-421a-ba6b-ea76332b49cf': {
    name: 'Professional Plan',
    price: 39.99,
    tokens: 1200000,
    description: 'Best for power users and large projects',
    features: [
      'Unlimited content creation',
      'Flow tokens',
      'Access to Flow community',
      'High-quality images',
      'Premium features'
    ]
  }
}

export function PlanComponent({ id }: PlanComponentProps) {
  const currentPlan = PLAN_DATA[id]

  if (!currentPlan) {
    return (
      <div className="bg-card w-full max-w-sm rounded-lg border p-6">
        <p className="text-muted-foreground">Plan not found</p>
      </div>
    )
  }

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
        <span className="text-muted-foreground ml-1">/ mo</span>
      </div>

      {/* Tokens */}
      {tokens && (
        <div className="mb-4 text-sm">
          <span className="text-muted-foreground">Tokens: </span>
          <span className="font-medium">{tokens.toLocaleString()}</span>
        </div>
      )}

      {/* Features */}
      <div className="mb-4">
        <div className="mb-2 flex items-center">
          <Zap className="text-primary mr-1 h-4 w-4" />
          <span className="text-sm font-medium">Features</span>
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
