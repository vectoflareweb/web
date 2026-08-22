import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import docsCss from '@/styles/docs.css?url'
import { SITE_NAME } from '@/config'

/**
 * Docs 路由：route 定义(loader/head)留在静态文件，整套 fumadocs/collections
 * 渲染栈移到 $.lazy.tsx —— 否则 routeTree 的静态 import 会让文档框架的 ~600KB
 * chunk 进入全站 preload 图（营销站每页白白下载）。lazy 拆分后只有访问 /docs
 * 才下载渲染栈。
 */
const serverLoader = createServerFn({ method: 'GET' })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const { source } = await import('@/features/docs/source')
    const page = source.getPage(slugs)
    if (!page) throw notFound()
    const { env } = await import('@/lib/env')
    return {
      path: page.path,
      title: page.data.title,
      description: page.data.description,
      origin: new URL(env.BETTER_AUTH_URL).origin,
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  })

export const Route = createFileRoute('/docs/$')({
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? []
    const data = await serverLoader({ data: slugs })
    return { ...data, docsPath: `/docs/${slugs.join('/')}`.replace(/\/$/, '') || '/docs', markdownUrl: `/docs-md/${slugs.join('/')}` }
  },
  // Per-page title/description — sitemap.xml advertises every docs URL, so each
  // must not fall back to the site-wide default title (duplicate-title farm).
  // og:title/og:description 同步覆盖（否则分享卡片仍显示 __root 的全站默认值，与 <title> 脱节）。
  head: ({ loaderData }) => {
    const title = loaderData?.title ? `${loaderData.title} \u00b7 ${SITE_NAME} Docs` : `${SITE_NAME} Docs`
    const canonical = loaderData?.origin ? `${loaderData.origin}${loaderData.docsPath}` : null
    return {
      meta: [
        { title },
        { property: 'og:title', content: title },
        ...(loaderData?.description
          ? [
              { name: 'description', content: loaderData.description },
              { property: 'og:description', content: loaderData.description },
            ]
          : []),
        ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
      ],
      links: [
        { rel: 'stylesheet', href: docsCss },
        ...(canonical ? [{ rel: 'canonical', href: canonical }] : []),
      ],
    }
  },
})
