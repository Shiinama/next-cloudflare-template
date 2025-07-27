'use client'

import { Coins } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useUser } from '@/contexts/user-context'
import { useRouter } from '@/i18n/navigation'

interface UsageCardSimpleProps {
  className?: string
}

export function UsageCard({ className = '' }: UsageCardSimpleProps) {
  const { usage } = useUser()
  const router = useRouter()

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (!usage) return null

  const remainingTokens = usage.totalTokens - usage.usedTokens

  return (
    <div className={`bg-card/80 rounded-lg border-b px-2 py-1.5 ${className}`}>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins className="text-primary h-4 w-4" />
          <span className="text-sm font-medium">Tokens</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            router.push('pricing')
          }}
          className="bg-primary/10 hover:bg-primary/20 text-primary h-7 px-2 text-xs"
        >
          Upgrade
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Total</span>
          <span className="font-mono text-sm font-medium">{formatNumber(usage.totalTokens)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Remaining</span>
          <span className="text-primary font-mono text-sm font-medium">{formatNumber(remainingTokens)}</span>
        </div>
      </div>
    </div>
  )
}
