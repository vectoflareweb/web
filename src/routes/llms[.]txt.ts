import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { LLMS_TXT } from '@/product/llms-content'
import {
  llmsIndex,
  llmProductsIndex,
  llmSolutionsIndex,
  llmProjectsIndex,
  llmKnowledgeIndex,
  llmSpanishIndex,
} from '@/features/site/llm'

// `/llms.txt` — LLM-friendly company facts card plus a full navigation index
// to every live page (see https://llmstxt.org). Index links are absolute URLs
// (per the spec) so LLMs can fetch pages directly. Derived sections share the
// sitemap rule: edge/legacy-301'd paths never appear as canonical URLs.
const handler = () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  return new Response(
    LLMS_TXT +
      llmsIndex(origin) +
      llmProductsIndex(origin) +
      llmSolutionsIndex(origin) +
      llmProjectsIndex(origin) +
      llmKnowledgeIndex(origin) +
      llmSpanishIndex(origin),
    { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } },
  )
}

export const Route = createFileRoute('/llms.txt')({
  server: { handlers: { GET: handler } },
})
