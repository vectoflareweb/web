import { createFileRoute, redirect } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/features/i18n/locale'

/**
 * Legacy landing page — superseded by the Solutions system
 * (/solutions/resort-sup). Permanent 301 so indexed URLs and any
 * inbound links consolidate on the new page.
 */
export const Route = createFileRoute('/{-$locale}/sup-for-resorts')({
  loader: ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    throw redirect({ href: localizePath(locale, '/solutions/resort-sup'), statusCode: 301 })
  },
  component: () => null,
})
