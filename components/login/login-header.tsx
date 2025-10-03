'use client'

import { LogIn, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { AvatarWithProgress } from '@/components/ui/avatar-with-progress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/contexts/user-context'
import { useIsMobile } from '@/hooks/use-mobile'

export default function LoginHeader() {
  const t = useTranslations('login')
  const isMobile = useIsMobile()
  const { status, user, checkIsLoggedIn } = useUser()

  if (status === 'loading') return null

  if (status === 'authenticated') {
    if (isMobile) {
      return (
        <div className="border-border/40 flex items-center justify-between gap-3 border-b px-1 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AvatarWithProgress
              src={user?.image || ''}
              alt={user?.name || 'User'}
              width={40}
              height={40}
              fallback={user?.name?.[0] || user?.email?.[0] || '?'}
              progress={0}
            />
            <div className="min-w-0 flex-1">
              {user?.name && <p className="truncate font-medium">{user.name}</p>}
              {user?.email && <p className="text-muted-foreground truncate text-xs">{user.email}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            title={t('signOut')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <AvatarWithProgress
              src={user?.image || ''}
              alt={user?.name || 'User'}
              width={40}
              height={40}
              fallback={user?.name?.[0] || user?.email?.[0] || '?'}
              progress={0}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              {user?.name && <p className="font-medium">{user.name}</p>}
              {user?.email && <p className="text-muted-foreground truncate text-xs">{user.email}</p>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div
      onClick={checkIsLoggedIn}
      className="text-foreground hover:text-primary group relative flex cursor-pointer items-center font-medium transition-colors"
    >
      <LogIn className="mr-2 h-4 w-4" />
      {t('login')}
      <span className="bg-primary absolute -bottom-1 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"></span>
    </div>
  )
}
