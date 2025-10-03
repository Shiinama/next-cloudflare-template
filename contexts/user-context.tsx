'use client'

import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { createContext, useContext, ReactNode, useState } from 'react'

import LoginModal from '@/components/login/login-modal'

interface UserContextType {
  user: User | null
  status: 'authenticated' | 'loading' | 'unauthenticated'
  checkIsLoggedIn: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession()

  const [open, setOpen] = useState(false)
  const user = session?.user || null

  const checkIsLoggedIn = () => {
    if (!user) {
      setOpen(true)
      return false
    }
    return true
  }

  const value: UserContextType = {
    checkIsLoggedIn,
    user,
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
