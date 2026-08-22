import { createFileRoute } from '@tanstack/react-router'
import { getLLMText } from '@/features/docs/llm'

/**
 * Serves a docs page as LLM-friendly Markdown (`# title (url)` + body, no
 * frontmatter) — the target of the "Copy Markdown" button and handy for LLMs.
 * Slug is the path after `/docs-md/` (empty = the docs index).
 * source (fumadocs) 动态加载：纯 server 路由，避免文档栈进入 client bundle。
 */
const handler = async ({ request }: { request: Request }) => {
  const path = new URL(request.url).pathname
    .replace(/^\/docs-md\/?/, '')
    .replace(/\.mdx?$/, '')
  // 畸形百分号编码（如 /docs-md/%zz）会让 decodeURIComponent 抛 URIError——是 404 不是 500。
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  const slugs = decoded.split('/').filter(Boolean)
  const { source } = await import('@/features/docs/source')
  const page = source.getPage(slugs)
  if (!page) return new Response('Not found', { status: 404 })
  const text = getLLMText(page)
  if (text == null) return new Response('Not found', { status: 404 })
  return new Response(text, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}

export const Route = createFileRoute('/docs-md/$')({
  server: { handlers: { GET: handler } },
})
