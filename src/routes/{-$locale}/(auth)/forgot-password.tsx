import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { requestPasswordReset } from '@/features/auth/auth.client'
import { getTurnstileSiteKey } from '@/features/auth/middleware'
import { useTurnstile, captchaHeaders } from '@/features/auth/components/turnstile'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { authPageHead } from '@/features/auth/head'
import { AuthCard, Field } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/{-$locale}/(auth)/forgot-password')({
  head: ({ params }) => authPageHead(params, 'forgotTitle'),
  loader: () => getTurnstileSiteKey(),
  component: Forgot,
})

function Forgot() {
  const turnstileSiteKey = Route.useLoaderData()
  const { t, locale } = useTranslation()
  const { token, enabled, widget, reset } = useTurnstile(turnstileSiteKey)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    // 带 locale 前缀：es 用户从邮件点回来落 /es/reset-password，而不是英文页
    await requestPasswordReset({ email, redirectTo: localizePath(locale, '/reset-password') }, captchaHeaders(token))
    reset() // tokens are single-use
    setDone(true) // never reveal whether the email exists
  }

  if (done) {
    return (
      <AuthCard title={t('auth.forgotTitle')} subtitle={t('auth.checkEmailReset')}>
        <a href={localizePath(locale, '/login')} className="font-semibold text-primary">
          {t('auth.login')}
        </a>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.forgotTitle')} subtitle={t('auth.forgotSub')}>
      <form onSubmit={submit} className="grid gap-4">
        <Field id="email" label={t('auth.email')} type="email" icon={Mail} value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        {widget}
        <Button type="submit" size="lg" className="w-full" disabled={enabled && !token}>
          {t('auth.resetPassword')}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-fg-2">
        <a href={localizePath(locale, '/login')} className="font-semibold text-primary">
          {t('auth.login')}
        </a>
      </p>
    </AuthCard>
  )
}
