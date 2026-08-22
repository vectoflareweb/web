import { createFileRoute } from '@tanstack/react-router'
import { Settings, ArrowRight } from 'lucide-react'
import { requireUser } from '@/features/auth/middleware'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { AppShell } from '@/components/app/app-shell'

export const Route = createFileRoute('/{-$locale}/app/')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async ({ params }) => {
    const user = await requireUser({ data: { locale: (params as { locale?: string }).locale } })
    return { user }
  },
  component: AppHome,
})

function AppHome() {
  const { user } = Route.useLoaderData()
  const { t } = useTranslation()
  const fl = useLocalizePath()

  return (
    <AppShell user={user} active="dashboard" crumb={t('app.dashboard')}>
      <div className="mb-6">
        <h1 className="page-h">{t('app.dashboard')}</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">{t('app.welcomeSub')}</p>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-3 text-sm text-fg-2">
        <span>{t('app.loggedInAs', { email: user.email })}</span>
      </div>

      <h2 className="mb-3.5 font-mono text-sm uppercase tracking-wide text-fg-3">{t('app.quickActions')}</h2>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <a href={fl('/app/account')} className="bg-card border border-border rounded-[14px] block p-[18px] transition-colors hover:border-border-strong">
          <span className="icon-tile">
            <Settings size={20} />
          </span>
          <div className="mb-1.5 mt-3.5 flex items-center gap-2">
            <h3 className="m-0 text-[15px] font-semibold text-foreground">{t('app.openAccount')}</h3>
            <ArrowRight size={15} className="text-fg-3" />
          </div>
          <p className="m-0 text-[13px] leading-snug text-fg-3">{t('app.openAccountSub')}</p>
        </a>
        <a href={fl('/app/feedback')} className="bg-card border border-border rounded-[14px] block p-[18px] transition-colors hover:border-border-strong">
          <span className="icon-tile">
            <ArrowRight size={20} />
          </span>
          <div className="mb-1.5 mt-3.5 flex items-center gap-2">
            <h3 className="m-0 text-[15px] font-semibold text-foreground">{t('feedback.nav')}</h3>
            <ArrowRight size={15} className="text-fg-3" />
          </div>
        </a>
      </div>
    </AppShell>
  )
}
