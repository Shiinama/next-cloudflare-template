import UpgradeChat from './upgrade-chat'

interface PlanComponentProps {
  title: string
  price: number
  products: string
}

export function PlanComponent({ title, price, products }: PlanComponentProps) {
  return (
    <div className={`bg-card w-full max-w-sm overflow-hidden rounded-lg border`}>
      <div className="p-6">
        <h3 className="text-card-foreground mb-2 text-2xl font-bold">{title}</h3>

        <div className="mt-4 mb-6">
          <span className="text-card-foreground text-4xl font-bold">{`$${price}`}</span>
          <span className="text-muted-foreground ml-2">/ mo</span>
        </div>
      </div>
      <div className="px-6 pb-6">
        <UpgradeChat products={products} />
      </div>
    </div>
  )
}
