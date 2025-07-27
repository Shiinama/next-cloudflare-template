import UpgradeChat from './upgrade-chat'

interface TokenPackage {
  name: string
  price: number
  tokens: number
}

interface TokenPackageProps {
  id: string
}

const TOKEN_PACKAGES_DATA: Record<string, TokenPackage> = {
  'fdf2240f-5e81-4f56-9ef1-9da446965827': {
    name: 'Trial Pack',
    price: 2.99,
    tokens: 30000
  },
  '084c2ee1-1c5f-4c36-baae-b3b61bae6a12': {
    name: 'Small Pack',
    price: 9.99,
    tokens: 150000
  },
  '61685d92-c00a-4424-aa5a-46be191d530d': {
    name: 'Medium Pack',
    price: 24.99,
    tokens: 400000
  }
}

export function TokenPackage({ id }: TokenPackageProps) {
  const currentPackage = TOKEN_PACKAGES_DATA[id]

  if (!currentPackage) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <p className="text-muted-foreground">Package not found</p>
      </div>
    )
  }

  const { name, price, tokens } = currentPackage

  return (
    <div className="bg-card hover:bg-card/80 group hover:border-primary/50 relative overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left: Icon, Name and Tokens */}
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-muted-foreground text-sm">{tokens.toLocaleString()} tokens</p>
          </div>
        </div>

        {/* Right: Price and Button */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-2xl font-bold">${price}</div>
            <div className="text-muted-foreground text-sm">One-time</div>
          </div>
        </div>
      </div>
      <UpgradeChat product={id} />
    </div>
  )
}
