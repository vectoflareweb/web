import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { resetPassword } from '@/features/auth/auth.client'
import { mapAuthError } from '@/features/auth/errors'
import { useTranslation } from '@/features/i18n/provider'
import { authPageHead } from '@/features/auth/head'
import { AuthCard, Field } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/{-$locale}/(auth)/reset-password')({
  head: ({ params }) => authPageHead(params, 'resetTitle'),
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({
    token: typeof s.token === 'string' ? s.token : undefined,
  }),
  component: Reset,
})

function Reset() {
  const { token } = Route.useSearch()
  const { t } = useTranslation()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError(t('auth.errors.invalidToken'))
      return
    }
    const res = await resetPassword({ newPassword: password, token })
    if (res.error) {
      setError(t(mapAuthError(res.error)))
      return
    }
    router.navigate({ to: '/{-$locale}/login' })
  }

  return (
    <AuthCard title={t('auth.resetTitle')} subtitle={t('auth.resetSub')}>
      <form onSubmit={submit} className="grid gap-4">
        <Field id="np" label={t('auth.newPassword')} icon={Lock} canToggle value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password"
          hint={t('auth.pwHint')} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full">
          {t('auth.resetPassword')}
        </Button>
      </form>
    </AuthCard>
  )
}
