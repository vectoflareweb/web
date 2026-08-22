import { createFileRoute, redirect } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/features/i18n/locale'

/**
 * Legacy landing page — superseded by the product-development pillar page
 * (custom product development with low-MOQ first runs). Permanent 301.
 */
export const Route = createFileRoute('/{-$locale}/sup-startup-brands')({
  loader: ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    throw redirect({ href: localizePath(locale, '/product-development'), statusCode: 301 })
  },
  component: () => null,
})
