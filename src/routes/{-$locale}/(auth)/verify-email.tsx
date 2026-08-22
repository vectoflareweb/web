import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { sendVerificationEmail } from '@/features/auth/auth.client'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { authPageHead } from '@/features/auth/head'
import { AuthCard, Field } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/{-$locale}/(auth)/verify-email')({
  head: ({ params }) => authPageHead(params, 'verifyTitle'),
  component: Verify,
})

function Verify() {
  const { t, locale } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function resend(e: React.FormEvent) {
    e.preventDefault()
    // 带 locale 前缀：es 用户验证完落 /es/app（/app 会按 locale 组渲染对应语言）
    await sendVerificationEmail({ email, callbackURL: localizePath(locale, '/app') })
    setSent(true)
  }

  return (
    <AuthCard title={t('auth.verifyTitle')} subtitle={t('auth.verifySub')}>
      {sent ? (
        <p className="text-sm text-fg-2">{t('auth.verifySent')}</p>
      ) : (
        <form onSubmit={resend} className="grid gap-4">
          <Field id="email" label={t('auth.email')} type="email" icon={Mail} value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          <Button type="submit" size="lg" className="w-full">
            {t('auth.resendVerification')}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
