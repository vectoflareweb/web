import { createFileRoute, redirect } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/features/i18n/locale'

/**
 * Legacy solution page — superseded by the product-development content page
 * (pipeline, FAQs and schema in one place). Permanent 301 so indexed URLs and
 * any inbound links consolidate on the new pillar page.
 */
export const Route = createFileRoute('/{-$locale}/custom-sup-development')({
  loader: ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    throw redirect({ href: localizePath(locale, '/product-development'), statusCode: 301 })
  },
  component: () => null,
})
