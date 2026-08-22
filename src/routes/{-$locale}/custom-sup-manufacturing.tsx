import { createFileRoute, redirect } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/features/i18n/locale'

/**
 * Legacy landing page — superseded by the product-development content page.
 * Permanent 301 so indexed URLs and any inbound links consolidate on it.
 */
export const Route = createFileRoute('/{-$locale}/custom-sup-manufacturing')({
  loader: ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    throw redirect({ href: localizePath(locale, '/product-development'), statusCode: 301 })
  },
  component: () => null,
})
