'use client'

import { useRequest } from 'ahooks'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { createContext, useContext, ReactNode, useState } from 'react'
import { toast } from 'sonner'

import { getUserOrder } from '@/actions/payment/orders'
import { getUserTokenBalance } from '@/actions/payment/tokens'
import LoginModal from '@/components/login/login-modal'
import { useRouter } from '@/i18n/navigation'
import { Currency, OrderStatus, PaymentMethod } from '@/lib/db/schema'

export interface UserUsage {
  totalTokens: number
  usedTokens: number
  availableTokens: number
}

export interface UserOrder {
  status: OrderStatus
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
  currency: Currency
  productId: string
  amount: number
  paymentMethod: PaymentMethod | null
  paymentIntentId: string | null
  metadata: string | null
}

interface UserContextType {
  user: User | null
  status: 'authenticated' | 'loading' | 'unauthenticated'
  checkIsLoggedIn: () => boolean
  checkIsPaid: () => boolean
  order?: UserOrder
  usage?: UserUsage
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const user = session?.user || null

  const { data: order } = useRequest(getUserOrder, {
    ready: !!user?.id
  })
  const { data: usage } = useRequest(getUserTokenBalance, {
    ready: !!user?.id
  })

  const checkIsLoggedIn = () => {
    if (!user) {
      setOpen(true)
      return false
    }
    return true
  }

  const checkIsPaid = () => {
    if (!user) {
      setOpen(true)
      return false
    }
    if (!order || order.status !== 'completed') {
      toast('Please purchase a plan before accessing premium features.')
      router.push('/pricing')
      return false
    }
    return true
  }

  const value: UserContextType = {
    checkIsLoggedIn,
    checkIsPaid,
    user,
    usage,
    order,
    status
  }

  return (
    <UserContext.Provider value={value}>
      <LoginModal open={open} setOpen={setOpen} />
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
