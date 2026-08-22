import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { signIn } from '@/features/auth/auth.client'
import { getEnabledSocialProviders, getTurnstileSiteKey } from '@/features/auth/middleware'
import { mapAuthError } from '@/features/auth/errors'
import { useTurnstile, captchaHeaders } from '@/features/auth/components/turnstile'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { authPageHead } from '@/features/auth/head'
import { AuthCard, Field } from '@/features/auth/components/auth-card'
import { SocialButtons } from '@/features/auth/components/social-buttons'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/{-$locale}/(auth)/login')({
  head: ({ params }) => authPageHead(params, 'loginTitle'),
  loader: async () => {
    const [providers, turnstileSiteKey] = await Promise.all([
      getEnabledSocialProviders(),
      getTurnstileSiteKey(),
    ])
    return { providers, turnstileSiteKey }
  },
  component: Login,
})

function Login() {
  const { providers, turnstileSiteKey } = Route.useLoaderData()
  const { t } = useTranslation()
  const router = useRouter()
  const fl = useLocalizePath()
  const { token, enabled, widget, reset } = useTurnstile(turnstileSiteKey)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await signIn.email({ email, password }, captchaHeaders(token))
    setBusy(false)
    if (res.error) {
      setError(t(mapAuthError(res.error)))
      reset() // tokens are single-use
      return
    }
    router.navigate({ to: '/{-$locale}/app' })
  }

  return (
    <AuthCard title={t('auth.loginTitle')} subtitle={t('auth.loginSub')}>
      <form onSubmit={submit} className="grid gap-4">
        <Field id="email" label={t('auth.email')} type="email" icon={Mail} value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        <div>
          <Field id="password" label={t('auth.password')} icon={Lock} canToggle value={password}
            onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <div className="mt-1.5 text-right">
            <a href={fl('/forgot-password')} className="text-[13px] font-semibold text-primary">
              {t('auth.forgotPassword')}
            </a>
          </div>
        </div>
        {widget}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || (enabled && !token)}>
          {t('auth.login')}
        </Button>
      </form>
      <SocialButtons providers={providers} />
      <p className="mt-5 text-center text-sm text-fg-2">
        {t('auth.noAccount')}{' '}
        <a href={fl('/register')} className="font-semibold text-primary">
          {t('auth.register')}
        </a>
      </p>
    </AuthCard>
  )
}
