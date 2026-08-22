import { createFileRoute } from '@tanstack/react-router'
import type { SearchAPI } from 'fumadocs-core/search/server'

/**
 * Docs 全文搜索（GET /api/search）——纯 server 路由。fumadocs/orama 依赖全部
 * 在 handler 内动态加载：路由定义会被 routeTree 静态 import，若顶层引入文档栈
 * 会把它拖进 client bundle 并进入全站 preload 图。
 */

// 索引构建是 CPU 密集操作：模块级惰性单例，避免每个请求重建 Orama 索引
// （否则公开端点 = 免费的 CPU 耗尽向量）。server 实例无跨请求状态，可安全复用。
let searchServer: SearchAPI | null = null

async function getSearchServer(): Promise<SearchAPI> {
  if (searchServer) return searchServer
  const [{ createFromSource }, { createTokenizer }, { stopwords: mandarinStopwords }, { source }] =
    await Promise.all([
      import('fumadocs-core/search/server'),
      import('@orama/tokenizers/mandarin'),
      import('@orama/stopwords/mandarin'),
      import('@/features/docs/source'),
    ])
  // Docs are Chinese, so index/query with a Mandarin tokenizer — Orama's default
  // tokenizer splits on whitespace and can't segment CJK, so 中文 queries返回空.
  // `createFromSource` reads each page's compiled `structuredData` (bundled, not
  // filesystem — safe on workerd) and defers indexing.
  searchServer = createFromSource(source, {
    tokenizer: createTokenizer({ language: 'mandarin', stopWords: mandarinStopwords }),
    search: { threshold: 0, tolerance: 0 },
  })
  return searchServer
}

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // 每 IP 限流：搜索是公开 CPU 密集端点，防止脚本循环调用烧 Worker。
        // KV 故障时放行（fail-open）——限流是阻尼不是安全边界。
        const { getRequestHeader } = await import('@tanstack/react-start/server')
        const { fixedWindowLimit } = await import('@/features/waitlist/rate-limit')
        try {
          const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'
          const allowed = await fixedWindowLimit(
            (await import('@/lib/env')).env.CACHE,
            `search:${ip}`,
            60,
            60,
            Date.now(),
          )
          if (!allowed) return new Response('Too Many Requests', { status: 429 })
        } catch (err) {
          console.error('[search] rate limit check failed (allowing)', err)
        }
        return (await getSearchServer()).GET(request)
      },
    },
  },
})
