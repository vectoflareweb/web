import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { MarketingShell } from '@/components/marketing/shell'

export interface LegalSection {
  heading: string
  body: string
}

export function LegalPage({
  title,
  sections,
}: {
  title: string
  sections: readonly LegalSection[]
}) {
  const { t } = useTranslation()
  const fl = useLocalizePath()
  return (
    <MarketingShell mainClassName="mx-auto max-w-[760px] px-5 md:px-7 py-16">
      <h1 className="page-h">{title}</h1>
      <p className="mt-2 text-sm text-fg-3">{t('legal.lastUpdated')}</p>
      {sections.map((s) => (
        <section key={s.heading} className="mt-10">
          <h2 className="text-lg font-semibold">{s.heading}</h2>
          <p className="mt-2 leading-relaxed text-fg-2">{s.body}</p>
        </section>
      ))}
      <p className="mt-12">
        <a href={fl('/')} className="font-semibold text-primary">
          ← {t('legal.backHome')}
        </a>
      </p>
    </MarketingShell>
  )
}
