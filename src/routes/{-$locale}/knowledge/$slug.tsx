import { createFileRoute, notFound } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { getArticle } from '@/product/knowledge'
import { KnowledgeArticlePage } from '@/components/marketing/knowledge-article-page'

export const Route = createFileRoute('/{-$locale}/knowledge/$slug')({
  loader: async ({ params }) => {
    const { locale, slug } = params as { locale?: string; slug: string }
    const l = (locale ?? 'en') as Locale
    if (!getArticle(l, slug)) throw notFound()
    return { origin: await getOrigin() }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const { locale, slug } = params as { locale?: string; slug: string }
    const l = (locale ?? 'en') as Locale
    const article = getArticle(l, slug)
    if (!article) return {}
    const { meta, links } = localeHead({
      origin,
      locale: l,
      path: `/knowledge/${slug}`,
      title: article.metaTitle,
      description: article.metaDescription,
    })
    return { meta, links }
  },
  component: KnowledgeArticle,
})

function KnowledgeArticle() {
  const { locale } = useTranslation()
  const { slug } = Route.useParams()
  const article = getArticle(locale, slug)
  if (!article) return null
  return <KnowledgeArticlePage article={article} />
}
