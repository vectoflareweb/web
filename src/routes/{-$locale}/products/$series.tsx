import { createFileRoute } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getTurnstileSiteKey } from '@/features/auth/middleware'
import type { Locale } from '@/features/i18n/locale'
import { getSeriesPage } from '@/product/series-pages'
import type { SeriesPageData } from '@/product/series-pages'
import type { CatchAllData } from '@/features/content/catchall'

type ProductCatchAll = Extract<CatchAllData, { kind: 'product' }>

export const Route = createFileRoute('/{-$locale}/products/$series')({
  validateSearch: (s: Record<string, unknown>): { platform?: string } => ({
    platform: typeof s.platform === 'string' ? s.platform : undefined,
  }),
  loader: async ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const slug = (params as { series: string }).series
    const page = getSeriesPage(locale, slug)
    const [origin, turnstileSiteKey] = await Promise.all([getOrigin(), getTurnstileSiteKey()])
    if (page) return { origin, turnstileSiteKey, page, product: null as ProductCatchAll | null }
    const { contentProductLoader } = await import('@/features/content/catchall')
    const product = await contentProductLoader({ data: { slug, locale } })
    return { origin, turnstileSiteKey, page: null as SeriesPageData | null, product }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const page = loaderData?.page
    const product = loaderData?.product
    if (!page && !product) return {}
    const { meta, links } = localeHead({
      origin,
      locale,
      path: `/products/${page?.slug ?? product?.product.slug ?? ''}`,
      title: page ? page.metaTitle : product ? product.title : '',
      description: page ? page.metaDescription : product ? product.description : '',
    })
    return { meta, links }
  },
})
