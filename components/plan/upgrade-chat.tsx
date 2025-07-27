'use client'

import { ArrowRight } from 'lucide-react'

interface UpgradeChatProps {
  product: string
  variant?: 'default' | 'compact'
}

function UpgradeChat({ product, variant = 'default' }: UpgradeChatProps) {
  const toUpgradeChat = () => {
    let src = `https://upgrade.chat/view-embed/2d7ea31d-bcb0-4062-b476-327bd6d7a8d6`
    const queryParams = [`embedder_url=${encodeURIComponent(window.location.href)}`, `productId=${product}`]

    if (queryParams.length > 0) {
      src += `?${queryParams.join('&')}`
    }

    const width = 350
    const height = 450

    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    window.open(src, '_blank', `width=${width},height=${height},top=${top},left=${left}`)
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toUpgradeChat}
        className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition duration-200"
      >
        PayPal
        <ArrowRight className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toUpgradeChat}
      className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 w-full rounded-full px-4 py-3 font-bold transition duration-200"
    >
      PayPal
    </button>
  )
}

export default UpgradeChat
