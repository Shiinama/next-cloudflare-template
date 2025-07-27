import { getActiveProducts } from '@/actions/payment/products'
import { PlanComponent } from '@/components/plan/plan-card'
import { TokenPackage } from '@/components/plan/token-card'

async function Pricing() {
  const products = await getActiveProducts()
  const subscriptionProducts = products.filter((product) => product.type === 'subscription')
  const oneTimeProducts = products.filter((product) => product.type === 'one_time')
  return (
    <div className="mb-20 flex flex-col items-center justify-center p-4">
      <h1 className="text-foreground mb-8 text-4xl font-bold">Choose Your Plan</h1>
      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {subscriptionProducts.map((i) => {
          return <PlanComponent key={i.id} id={i.id} />
        })}
      </div>

      <h2 className="text-foreground mb-8 text-3xl font-bold">Flow Tokens</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {oneTimeProducts.map((i) => {
          return <TokenPackage key={i.id} id={i.id} />
        })}
      </div>
    </div>
  )
}

export default Pricing
