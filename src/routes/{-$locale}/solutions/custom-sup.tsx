import { createFileRoute, redirect } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/features/i18n/locale'

/**
 * The custom-SUP solution consolidated on the product-development pillar page
 * (pipeline, FAQs and schema in one place). Permanent 301 so indexed URLs and
 * inbound links consolidate on it.
 */
export const Route = createFileRoute('/{-$locale}/solutions/custom-sup')({
  loader: ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    throw redirect({ href: localizePath(locale, '/product-development'), statusCode: 301 })
  },
  component: () => null,
})
