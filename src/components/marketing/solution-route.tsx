import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { isLocale, defaultLocale, type Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { getSolutionPage, solutionPath } from '@/product/solution-pages'
import { SolutionPage } from './solution-page'
import { MarketingShell } from './shell'

/**
 * Shared route factory for the Solutions system pages. The canonical URL of a
 * page comes from solutionPath(slug) — the flagship custom-SUP page lives at
 * /custom-sup-development (keyword-first URL), the rest under /solutions/*.
 */
export function solutionRoute(slug: string) {
  const path = solutionPath(slug)
  return {
    loader: async () => ({ origin: await getOrigin() }),
    head: ({ loaderData, params }: { loaderData?: { origin: string } | null; params?: unknown }) => {
      const origin = loaderData?.origin ?? ''
      const raw = (params as Record<string, string | undefined>)?.locale
      const locale: Locale = isLocale(raw) ? raw : defaultLocale
      const page = getSolutionPage(locale, slug)
      const { meta, links } = localeHead({
        origin,
        locale,
        path,
        title: page?.metaTitle ?? slug,
        description: page?.metaDescription ?? '',
      })
      return { meta, links }
    },
    component: function SolutionPageRoute() {
      const { locale } = useTranslation()
      const page = getSolutionPage(locale, slug)
      if (!page) return null
      return (
        <MarketingShell>
          <SolutionPage page={page} />
        </MarketingShell>
      )
    },
  }
}
