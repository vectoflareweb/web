import { createFileRoute } from '@tanstack/react-router'
import { Search as SearchIcon, ArrowRight } from 'lucide-react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate, localizePath } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { searchIndexServer, type SearchEntry } from '@/features/site/search'
import { TYPE_CLASS } from '@/features/site/search-type-class'
import { PageHero } from '@/components/marketing/section-head'
import { MarketingShell } from '@/components/marketing/shell'
import { SITE_NAME } from '@/config'

const MAX_SEARCH_RESULTS = 24

interface SearchParams {
  q?: string
}

export const Route = createFileRoute('/{-$locale}/search')({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: typeof s.q === 'string' ? s.q : undefined }),
  loader: async ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const [origin, entries] = await Promise.all([getOrigin(), searchIndexServer({ data: { locale } })])
    return { origin, entries }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/search',
      title: translate(d, 'content.seo.searchTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.searchDesc'),
    })
    meta.push({ name: 'robots', content: 'noindex, follow' })
    return { meta, links }
  },
  component: SearchPage,
})

function SearchPage() {
  const { locale, t } = useTranslation()
  const { entries } = Route.useLoaderData()
  const { q } = Route.useSearch()
  const query = (q ?? '').trim().toLowerCase()
  const results: SearchEntry[] = query
    ? entries
        .filter(
          (it) =>
            it.title.toLowerCase().includes(query) ||
            it.excerpt.toLowerCase().includes(query) ||
            (it.content ?? '').toLowerCase().includes(query),
        )
        .slice(0, MAX_SEARCH_RESULTS)
    : []

  return (
    <MarketingShell>
      <PageHero kicker={t('common.searchResultsTitle')} title={query ? t('common.searchResultsFor', { query }) : t('common.searchResultsTitle')}>
        <div className="mt-7 flex max-w-2xl flex-col gap-4">
          <form action={localizePath(locale, '/search')} method="get" className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-[var(--shadow-sm)]">
            <SearchIcon size={18} className="shrink-0 text-fg-3" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder={t('common.searchPlaceholder')}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-fg-3"
              aria-label={t('common.search')}
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
            >
              {t('common.search')}
            </button>
          </form>
        </div>
      </PageHero>

      <section className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        {!query ? (
          <p className="text-center text-[15px] text-fg-3">{t('common.searchStart')}</p>
        ) : results.length === 0 ? (
          <p className="text-center text-[15px] text-fg-3">{t('common.searchResultsEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((m) => (
              <li key={m.url}>
                <a
                  href={m.url}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-primary/40 hover:bg-bg-alt"
                >
                  <span className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_CLASS[m.type]}`}>
                    {t(`common.type${m.type[0].toUpperCase()}${m.type.slice(1)}`)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-foreground">{m.title}</span>
                    {m.excerpt && <span className="mt-0.5 block truncate text-[13px] text-fg-3">{m.excerpt}</span>}
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-fg-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MarketingShell>
  )
}