import { useState } from 'react'
import { Download, Mail, ShieldCheck } from 'lucide-react'
import { Field } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useTurnstile } from '@/features/auth/components/turnstile'
import { useTranslation } from '@/features/i18n/provider'
import { pick, catalogDownload } from '@/product/content'
import { trackLead } from '@/features/analytics/events'
import { joinWaitlist } from '@/features/waitlist/waitlist.actions'

/**
 * Catalog download — email capture for the full product catalog + MOQ sheet.
 * Reuses the waitlist server pipeline (rate limit, Turnstile, D1, audience sync)
 * with source='catalog'; the catalog itself is delivered by the sales team.
 */
export function CatalogDownload({ turnstileSiteKey }: { turnstileSiteKey: string | null }) {
  const { locale, t } = useTranslation()
  const c = pick(catalogDownload, locale)
  const { token, widget, reset } = useTurnstile(turnstileSiteKey)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const { status } = await joinWaitlist({ data: { email, locale, turnstileToken: token ?? '', source: 'catalog' } })
      if (status === 'added' || status === 'already') {
        setMsg({ kind: 'ok', text: `${c.successTitle}. ${c.successBody.replace('{email}', email)}` })
        trackLead('catalog')
      } else if (status === 'invalid-email') {
        setMsg({ kind: 'err', text: t('content.catalog.invalidEmail') })
      } else if (status === 'rate-limited') {
        setMsg({ kind: 'err', text: t('content.catalog.rateLimited') })
      } else {
        setMsg({ kind: 'err', text: t('content.catalog.captchaFailed') })
      }
      if (status !== 'added' && status !== 'already') reset()
    } catch {
      setMsg({ kind: 'err', text: t('content.catalog.captchaFailed') })
      reset()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border-t border-border bg-bg-alt">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-8 lg:px-10 md:py-20">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-primary">{c.kicker}</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">{c.title}</h2>
          <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-fg-2">{c.body}</p>
          <p className="mt-4 flex items-center gap-2 text-[12.5px] font-medium text-fg-3">
            <ShieldCheck className="h-4 w-4 text-primary" /> {c.secure}
          </p>
        </div>
        <form onSubmit={submit} className="marine-card flex flex-col gap-4 p-6 md:p-8">
          <Field
            id="catalog-email"
            label={c.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
            placeholder={c.emailPlaceholder}
          />
          {widget}
          {msg && (
            <p className={msg.kind === 'ok' ? 'text-sm leading-relaxed text-success' : 'text-sm text-destructive'}>{msg.text}</p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            <Download className="mr-2 h-4 w-4" /> {c.submit}
          </Button>
        </form>
      </div>
    </section>
  )
}