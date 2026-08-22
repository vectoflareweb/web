/**
 * AI sales assistant — server handler for POST /api/ask.
 *
 * Pipeline: embed question → Vectorize top-K → prompt → Workers AI LLM, with
 * graceful degradation: without AI/Vectorize bindings (or on any failure) it
 * falls back to keyword-matched site FAQs, and finally to an empty "none"
 * answer. Hot answers are cached in KV. The heavy content loader is imported
 * lazily so the worker startup graph stays small.
 */

import { defaultLocale, localizePath, type Locale } from '@/features/i18n/locale'
import { buildAskPrompt, faqSlug, matchFaq, matchCorpus, stableHash, type AiChunk, type AskMessage, type AskSource } from './rag'

const EMBED_MODEL = '@cf/baai/bge-m3'
const LLM_MODEL = '@cf/meta/llama-3.2-3b-instruct'
const TOP_K = 6
/** Cosine floor below which chunks are treated as noise — keeps the LLM from
 *  confabulating an answer from unrelated retrieval (e.g. "where is the
 *  company?" matching drop-stitch material). Tune against live queries. */
const REL_SCORE_MIN = 0.3
const MAX_QUESTION = 500
const CACHE_TTL = 6 * 60 * 60
const CACHE_PREFIX = 'aiask:'

export interface AskInput {
  question: string
  history?: AskMessage[]
  locale?: string
}

export interface AskResponse {
  answer: string
  sources: AskSource[]
  mode: 'ai' | 'faq' | 'none'
}

export interface AskEnv {
  CACHE: KVNamespace
  AI?: Ai
  VECTORIZE?: VectorizeIndex
}

export async function ask(env: AskEnv, input: AskInput): Promise<AskResponse> {
  const question = input.question.trim().slice(0, MAX_QUESTION)
  if (!question) return { answer: '', sources: [], mode: 'none' }
  const locale = (input.locale && input.locale !== defaultLocale ? input.locale : defaultLocale) as Locale

  const cacheKey = `${CACHE_PREFIX}${locale}:${stableHash(question.toLowerCase())}`
  try {
    const cached = await env.CACHE.get<AskResponse>(cacheKey, 'json')
    if (cached) return cached
  } catch {
    console.warn('[ai] KV cache read failed (recomputing)')
  }

  const result =
    env.AI && env.VECTORIZE
      ? await askWithRag(env, question, locale, input.history)
      : await askFromFaq(question, locale)

  if (result.mode !== 'none') {
    try {
      await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL })
    } catch {
      console.warn('[ai] KV cache write failed (best-effort)')
    }
  }
  return result
}

async function askWithRag(env: AskEnv, question: string, locale: Locale, history?: AskMessage[]): Promise<AskResponse> {
  try {
    // The generated bge-m3 output type is a union across input variants — the
    // embedding variant is what we requested with `{ text: [...] }`.
    const embedded = (await env.AI!.run(EMBED_MODEL, { text: [question] })) as unknown as {
      data?: { embedding: number[] }[]
    }
    const vector = embedded.data?.[0]?.embedding
    if (!vector) throw new Error('embedding failed')
    const { matches } = await env.VECTORIZE!.query(vector, {
      topK: TOP_K,
      returnValues: false,
      returnMetadata: 'all',
    })
    // FAQ chunks are the highest-value matches for buyer questions — surface
    // them first (stable sort keeps score order within each group).
    const faqPath = localizePath(locale, '/faq')
    const chunks: AiChunk[] = matches
      .filter((m) => typeof m.score === 'number' && m.score >= REL_SCORE_MIN)
      .map((m) => ({
        id: String(m.id),
        text: String(m.metadata?.text ?? ''),
        url: String(m.metadata?.url ?? ''),
        title: String(m.metadata?.title ?? ''),
      }))
      .filter((c) => c.text && c.url)
      .sort((a, b) => Number(b.url === faqPath) - Number(a.url === faqPath))
    if (chunks.length === 0) return await askFromFaq(question, locale)

    const { system, user } = buildAskPrompt({ question, history, chunks })
    const out = await env.AI!.run(LLM_MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 400,
      stream: false,
    })
    const answer = (out.response ?? '').trim()
    if (!answer) throw new Error('llm returned empty response')
    const seen = new Set<string>()
    const sources: AskSource[] = []
    for (const c of chunks) {
      if (seen.has(c.url)) continue
      seen.add(c.url)
      sources.push({ title: c.title, url: c.url })
      if (sources.length === 4) break
    }
    return { answer, sources, mode: 'ai' }
  } catch (err) {
    console.error('[ai] RAG ask failed, falling back to FAQ', err instanceof Error ? err.message : err)
    return await askFromFaq(question, locale)
  }
}

/** Degraded path: keyword-match against the site FAQ collection, then corpus chunks. */
async function askFromFaq(question: string, locale: Locale): Promise<AskResponse> {
  try {
    const { getSiteFaqs } = await import('@/features/content/loader')
    const { localizePath } = await import('@/features/i18n/locale')

    const faqHit = matchFaq(question, getSiteFaqs(locale))
      || (locale !== defaultLocale && matchFaq(question, getSiteFaqs(defaultLocale)))
    if (faqHit) {
      const anchor = faqSlug(faqHit.faq.q)
      return {
        answer: faqHit.answer,
        sources: [{ title: faqHit.faq.q, url: `${localizePath(locale, '/faq')}#${anchor}` }],
        mode: 'faq',
      }
    }

    const { buildChunks } = await import('./corpus')
    const chunks = buildChunks(locale)
    const corpusHit = matchCorpus(question, chunks)
    if (corpusHit) {
      return {
        answer: corpusHit.answer,
        sources: [{ title: corpusHit.chunk.title, url: corpusHit.chunk.url }],
        mode: 'faq',
      }
    }

    return { answer: '', sources: [], mode: 'none' }
  } catch (err) {
    console.error('[ai] FAQ/corpus fallback failed', err instanceof Error ? err.message : err)
    return { answer: '', sources: [], mode: 'none' }
  }
}
