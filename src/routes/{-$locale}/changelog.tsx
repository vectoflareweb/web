import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { selectChangelog, type ChangelogRaw } from '@/features/changelog/select'
import { dictionaries } from '@/features/i18n/locale'
import type { Locale } from '@/features/i18n/locale'
import { SITE_NAME } from '@/config'

const getEntries = createServerFn({ method: 'GET' })
  .validator((locale: string) => locale)
  .handler(async ({ data: locale }) => {
    const { changelog } = await import('collections/server')
    return selectChangelog(changelog as unknown as ChangelogRaw[], locale)
  })

/**
 * Changelog 渲染栈（fumadocs collections/orama）在 lazy 文件按需加载：
 * changelog 是营销站静态路由，routeTree 的静态 import 会把或拉索引拖进全站
 * preload 图，让每个页面都下载文档渲染栈。壳与列表整体移入 changelog.lazy.tsx。
 */
export const Route = createFileRoute('/{-$locale}/changelog')({
  loader: async ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const [origin, user, entries] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getEntries({ data: locale }),
    ])
    return { origin, loggedIn: !!user, entries }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/changelog',
      title: `${dict.changelog.title} \u2014 ${SITE_NAME}`,
      description: dict.changelog.subtitle,
    })
    return { meta, links }
  },
})
