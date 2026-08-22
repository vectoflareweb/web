import { createLazyFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { MarketingShell } from '@/components/marketing/shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/features/i18n/provider'
import { fmtDate } from '@/lib/format-date'
import browserCollections from 'collections/browser'

/**
 * Changelog 页面(壳 + 条目列表)。整个文件懒加载 —— collections/browser
 * (fumadocs/orama) 只在访问 /changelog 时下载，不进全站 preload 图。
 */
const clientLoader = browserCollections.changelog.createClientLoader({
  id: 'changelog',
  component({ default: MDX }) {
    return <MDX />
  },
})

function Changelog() {
  const { entries } = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <MarketingShell mainClassName="mx-auto max-w-3xl px-4 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('changelog.title')}</h1>
          <p className="mt-2 text-fg-2">{t('changelog.subtitle')}</p>
        </header>
        <div className="space-y-6">
          {entries.map((e: { path: string; title: string; version: string; date: string }) => (
            <Card key={e.path}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{e.title}</CardTitle>
                  <Badge>{e.version}</Badge>
                </div>
                {/* fmtDate（UTC 确定性）：Intl 按浏览器时区渲染会 hydration mismatch，西时区还会差一天 */}
                <p className="text-sm text-fg-2">{fmtDate(e.date)}</p>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <Suspense>{clientLoader.useContent(e.path)}</Suspense>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </MarketingShell>
  )
}

export const Route = createLazyFileRoute('/{-$locale}/changelog')({ component: Changelog })
