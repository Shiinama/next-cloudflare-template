'use client'

import { useTranslations } from 'next-intl'

import LoginForm from '@/components/login/login-form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function LoginModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const t = useTranslations('login')
  const site = useTranslations('siteInfo')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">{site('brandName')}</DialogTitle>
          <DialogDescription className="text-center">{t('modal.description')}</DialogDescription>
        </DialogHeader>
        <LoginForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
