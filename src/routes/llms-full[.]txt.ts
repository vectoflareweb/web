import { createFileRoute } from '@tanstack/react-router'
import {
  llmSiteHeader,
  llmProductsFull,
  llmSolutionsFull,
  llmProjectsFull,
  llmKnowledgeFull,
  llmsFactoryFull,
  llmsFactorySpanishFull,
} from '@/features/site/llm'

// `/llms-full.txt` — the whole marketing site as plain Markdown (company facts
// card + every page body), so an LLM can ingest the full site in one request.
const handler = () =>
  new Response(
    llmSiteHeader() +
      llmProductsFull() +
      llmSolutionsFull() +
      llmProjectsFull() +
      llmKnowledgeFull() +
      llmsFactoryFull() +
      llmsFactorySpanishFull(),
    {
      headers: { 'content-type': 'text/markdown; charset=utf-8' },
    },
  )

export const Route = createFileRoute('/llms-full.txt')({
  server: { handlers: { GET: handler } },
})
