import UpgradeChat from './upgrade-chat'

interface TokenPackageProps {
  title: string
  price: number
  products: string
}

export function TokenPackage({ title, price, products }: TokenPackageProps) {
  return (
    <div className="border-border bg-card w-full max-w-sm min-w-[275px] overflow-hidden rounded-lg border p-6">
      <h3 className="text-card-foreground mb-2 text-xl font-bold">{title}</h3>
      <div className="text-card-foreground mb-4 text-3xl font-bold">{`$${price}`}</div>
      <UpgradeChat products={products} />
    </div>
  )
}
