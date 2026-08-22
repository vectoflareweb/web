import { createFileRoute } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getTurnstileSiteKey } from '@/features/auth/middleware'
import { MarketingShell } from '@/components/marketing/shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/features/i18n/provider'
import { WaitlistForm } from '@/features/waitlist/components/waitlist-form'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import { SITE_NAME } from '@/config'

export const Route = createFileRoute('/{-$locale}/waitlist')({
  loader: async () => {
    const [origin, turnstileSiteKey] = await Promise.all([
      getOrigin(),
      getTurnstileSiteKey(),
    ])
    return { origin, turnstileSiteKey }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/waitlist',
      title: translate(d, 'content.seo.waitlistTitle') + ` \u2014 ${SITE_NAME}`,
      description: translate(d, 'content.seo.waitlistDesc'),
    })
    return { meta, links }
  },
  component: WaitlistPage,
})

function WaitlistPage() {
  const { turnstileSiteKey } = Route.useLoaderData()
  const { t } = useTranslation()
  return (
    <MarketingShell mainClassName="mx-auto flex max-w-md flex-col px-4 py-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('waitlist.title')}</CardTitle>
          <CardDescription>{t('waitlist.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <WaitlistForm turnstileSiteKey={turnstileSiteKey} source="waitlist" />
        </CardContent>
      </Card>
    </MarketingShell>
  )
}
