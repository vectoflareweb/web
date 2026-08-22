import { createFileRoute, redirect, ErrorComponent } from '@tanstack/react-router'
import { OG_IMAGE, localeHead } from '@/features/seo/seo'
import { isLocale, defaultLocale, localizePath, type Locale } from '@/features/i18n/locale'
import { OG_LOCALE, ACTIVE_LOCALES } from '@/config/locales'
import { SITE_NAME } from '@/config/site'
import { ContentCatchAll } from '@/features/content/catchall'

/**
 * Catch-all route for the content site.
 *
 * Serves every prefix-less and locale-prefixed URL (`/factory`, `/es/factory`,
 * `/news/...`) by stripping a leading valid locale segment and resolving the
 * rest against the content page registry. Pages with a Spanish variant
 * (`{slug}.es.yaml`) render translated content with a proper es head; pages
 * without one keep the English content and are noindexed as duplicates.
 * Unknown paths throw notFound().
 */
const stripLocalePrefix = (path: string): string => {
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 0 && isLocale(segments[0])) return `/${segments.slice(1).join('/')}`
  return path
}

export const Route = createFileRoute('/$')({
  errorComponent: ErrorComponent,
  loader: async ({ params }) => {
    const splat = params._splat ?? ''
    const raw = `/${splat}`.replace(/\/+$/, '') || '/'
    const segments = raw.split('/').filter(Boolean)
    const localized = segments.length > 0 && isLocale(segments[0])
    const locale = (localized ? segments[0] : defaultLocale) as Locale
    const path = stripLocalePrefix(raw)
    // '/en/...' �?permanent redirect to the canonical no-prefix URL. The
    // {-$locale} group enforces this only for its own template routes; content
    // pages / products / news land here, so the catch-all must apply the same
    // rule (otherwise /en/factory would 200-render a noindexed duplicate).
    if (localized && locale === defaultLocale) {
      throw redirect({ href: path, statusCode: 301 })
    }
    const { contentServerLoader } = await import('@/features/content/catchall')
    return { ...(await contentServerLoader({ data: { path, locale } })), localized }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { origin, path, title, description, locale, translated } = loaderData
    const canonical = `${origin}${path}`
    const image = loaderData.kind === 'page' ? OG_IMAGE : ((loaderData as { image?: string }).image ?? OG_IMAGE)
    // og:image must be absolute; local /assets/* refs are resolved against the
    // site origin, and the 1200x630 pair only applies to the shared OG_IMAGE.
    // Product images are AVIF for the <img> but crawlers lag on AVIF �?point
    // og:image at the sibling JPG (kept alongside), after URL resolution.
    const absImage = (image.startsWith('http') ? image : `${origin}${image}`).replace(/\.avif$/, '.jpg')
    // Translated /es/* pages get a real Spanish head (canonical �?/es, es_ES
    // OG locale, hreflang alternates) and are indexable.
    if (loaderData.localized && translated) {
      return localeHead({ origin, locale, path, title, description, image: absImage })
    }
    const meta: Record<string, string>[] = [
      { title },
      { name: 'description', content: description },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:locale', content: OG_LOCALE[locale] ?? 'en_US' },
      ...ACTIVE_LOCALES.filter((l) => l !== locale).map((l) => ({ property: 'og:locale:alternate', content: OG_LOCALE[l] })),
      { property: 'og:type', content: loaderData.kind === 'post' || loaderData.kind === 'article' ? 'article' : 'website' },
      ...(loaderData.kind === 'post' && loaderData.post.date ? [{ property: 'article:published_time', content: loaderData.post.date }] : []),
      ...(loaderData.kind === 'page' && loaderData.page.meta?.datePublished ? [{ property: 'article:published_time', content: loaderData.page.meta.datePublished }] : []),
      { property: 'og:image', content: absImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: absImage.endsWith('.webp') ? 'image/webp' : 'image/jpeg' },
      { property: 'og:image:alt', content: `${SITE_NAME} �?${title.replace(/\s+\|.*$/, '')}` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@myproduct' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: absImage },
      { name: 'twitter:image:alt', content: `${SITE_NAME} �?${title.replace(/\s+\|.*$/, '')}` },
    ]
    // /es/* content pages without a translation render the same English content
    // as their en twin (canonical �?en). Noindex the duplicate so only the en
    // page ranks.
    if (loaderData.localized) {
      meta.push({ name: 'robots', content: 'noindex, follow' })
    }
    // en twin of a page with a real /es translation: emit the es alternate so
    // hreflang is bidirectional (sitemap already cross-links; the page head
    // must mirror it �?Google requires the return tag on both sides).
    const hasEsTwin = !loaderData.localized && loaderData.esTranslated
    const links: Record<string, string>[] = [{ rel: 'canonical', href: canonical }]
    if (hasEsTwin) {
      links.push({ rel: 'alternate', hreflang: 'en-US', href: canonical })
      links.push({ rel: 'alternate', hreflang: 'es-ES', href: `${origin}${localizePath('es', loaderData.path)}` })
      links.push({ rel: 'alternate', hreflang: 'x-default', href: canonical })
    }
    return { meta, links }
  },
  component: CatchAllPage,
})

function CatchAllPage() {
  const data = Route.useLoaderData()
  return <ContentCatchAll data={data} />
}