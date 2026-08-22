import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Field } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useTurnstile } from '@/features/auth/components/turnstile'
import { useTranslation } from '@/features/i18n/provider'
import { joinWaitlist } from '@/features/waitlist/waitlist.actions'
import type { WaitlistSource } from '@/features/waitlist/source'

export function WaitlistForm({
  turnstileSiteKey,
  source,
}: {
  turnstileSiteKey: string | null
  source: WaitlistSource
}) {
  const { t, locale } = useTranslation()
  const { token, widget, reset } = useTurnstile(turnstileSiteKey)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const { status } = await joinWaitlist({ data: { email, locale, turnstileToken: token ?? '', source } })
      if (status === 'added') setMsg({ kind: 'ok', text: t('waitlist.added') })
      else if (status === 'already') setMsg({ kind: 'ok', text: t('waitlist.already') })
      else if (status === 'invalid-email') setMsg({ kind: 'err', text: t('waitlist.invalidEmail') })
      else if (status === 'rate-limited') setMsg({ kind: 'err', text: t('waitlist.rateLimited') })
      else setMsg({ kind: 'err', text: t('waitlist.captcha') })
      // 任何失败都换新 token：服务端可能已消费旧 token（siteverify 单次有效），
      // 只在 captcha 状态重置会让下一次重试稳定失败一轮。
      if (status !== 'added' && status !== 'already') reset()
    } catch {
      // 网络/服务端异常：给出可重试的提示；finally 复位 busy，按钮不再永久卡死
      setMsg({ kind: 'err', text: t('waitlist.captcha') })
      reset()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field
        id="waitlist-email"
        label={t('waitlist.emailLabel')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        required
        placeholder="you@example.com"
      />
      {widget}
      {msg && (
        <p className={msg.kind === 'ok' ? 'text-sm text-success' : 'text-sm text-destructive'}>{msg.text}</p>
      )}
      <Button type="submit" disabled={busy}>
        {t('waitlist.submit')}
      </Button>
    </form>
  )
}
