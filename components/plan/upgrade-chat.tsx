'use client'

function UpgradeChat({ products }: { products: string }) {
  const toUpgradeChat = () => {
    let src = `https://upgrade.chat/view-embed/2d7ea31d-bcb0-4062-b476-327bd6d7a8d6`
    const queryParams = [`embedder_url=${encodeURIComponent(window.location.href)}`]
    if (products) {
      for (const product of products.split(',')) {
        queryParams.push(`productId=${product}`)
      }
    }
    if (queryParams.length > 0) {
      src += `?${queryParams.join('&')}`
    }

    const width = 350
    const height = 450

    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    window.open(src, '_blank', `width=${width},height=${height},top=${top},left=${left}`)
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
