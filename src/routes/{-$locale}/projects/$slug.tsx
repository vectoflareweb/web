import { createFileRoute, notFound } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { getProject } from '@/product/projects'
import { ProjectPage } from '@/components/marketing/project-page'

export const Route = createFileRoute('/{-$locale}/projects/$slug')({
  loader: async ({ params }) => {
    const { locale, slug } = params as { locale?: string; slug: string }
    const l = (locale ?? 'en') as Locale
    if (!getProject(l, slug)) throw notFound()
    return { origin: await getOrigin() }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const { locale, slug } = params as { locale?: string; slug: string }
    const l = (locale ?? 'en') as Locale
    const page = getProject(l, slug)
    if (!page) return {}
    const { meta, links } = localeHead({
      origin,
      locale: l,
      path: `/projects/${slug}`,
      title: page.metaTitle,
      description: page.metaDescription,
    })
    return { meta, links }
  },
  component: ProjectDynamicPage,
})

function ProjectDynamicPage() {
  const { locale } = useTranslation()
  const { slug } = Route.useParams()
  const page = getProject(locale, slug)
  if (!page) return null
  return <ProjectPage page={page} />
}
