/**
 * AI knowledge index rebuild (scheduled, 03:00 UTC).
 *
 * Re-embeds the whole corpus (both locales) with bge-m3 and upserts it into
 * the Vectorize index. Chunk ids are stable hashes of (locale, url, part), so
 * re-runs overwrite in place — no delete pass needed. The corpus builder is
 * imported lazily: it pulls in the 1.6 MB content loader, which must not be
 * part of the worker startup graph.
 */

import { locales, type Locale } from '@/features/i18n/locale'
import type { AiChunk } from './rag'

const NEURON_BUDGET_DAILY = 10_000
const NEURON_RESERVE_FOR_QUERIES = 7_000
const REINDEX_NEURON_ESTIMATE = 1_000
const NEURON_KEY_PREFIX = 'aiq:'

export interface IngestEnv {
  AI: Ai
  VECTORIZE: VectorizeIndex
  CACHE?: KVNamespace
}

const EMBED_MODEL = '@cf/baai/bge-m3'
/** Vectorize accepts at most 100 vectors per upsert call. */
const UPSERT_BATCH = 64
const EMBED_BATCH = 64
/** Workers AI gateway can transiently fail (HTTPError: 429/529/overload) — retry with backoff. */
const EMBED_ATTEMPTS = 4

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

export async function rebuildAiIndex(env: IngestEnv): Promise<{ locale: Locale; chunks: number }[]> {
  if (env.CACHE) {
    const day = new Date().toISOString().slice(0, 10)
    const used = await env.CACHE.get<number>(`${NEURON_KEY_PREFIX}${day}`, 'json').catch(() => null)
    if (used !== null && used * 14 + REINDEX_NEURON_ESTIMATE > NEURON_BUDGET_DAILY - NEURON_RESERVE_FOR_QUERIES) {
      console.log(`[ingest] skipping reindex — daily neuron budget near limit (queries≈${used}, budget=${NEURON_BUDGET_DAILY})`)
      return []
    }
  }
  const { buildChunks } = await import('./corpus')
  const stats: { locale: Locale; chunks: number }[] = []
  for (const locale of locales) {
    const chunks = buildChunks(locale)
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH)
      const vectors = await embedBatch(env, batch)
      const payload = batch.map((c, j) => ({
        id: c.id,
        values: vectors[j],
        metadata: { text: c.text, url: c.url, title: c.title, locale },
      }))
      for (let k = 0; k < payload.length; k += UPSERT_BATCH) {
        for (let attempt = 1; ; attempt++) {
          try {
            await env.VECTORIZE.upsert(payload.slice(k, k + UPSERT_BATCH))
            break
          } catch (err) {
            if (attempt >= EMBED_ATTEMPTS) {
              const msg = err instanceof Error ? err.message : String(err)
              throw new Error(`vectorize upsert failed: ${msg}`)
            }
            console.error(`[ingest] upsert failed (attempt ${attempt}), retrying`, err instanceof Error ? err.message : err)
            await sleep(500 * 2 ** attempt)
          }
        }
      }
    }
    stats.push({ locale, chunks: chunks.length })
  }
  return stats
}

async function embedBatch(env: IngestEnv, batch: AiChunk[]): Promise<number[][]> {
  const texts = batch.map((c) => c.text)
  let lastErr: unknown
  for (let attempt = 1; attempt <= EMBED_ATTEMPTS; attempt++) {
    try {
      const embedded = (await env.AI.run(EMBED_MODEL, { text: texts })) as unknown
      // bge-m3 output is a union across input variants — accept both
      // `{ data: { embedding: number[] }[] }` and a bare array of vectors,
      // so a shape drift fails loudly instead of leaking undefined values.
      const rows = Array.isArray(embedded) ? embedded : (embedded as { data?: unknown } | undefined)?.data
      const vectors = (Array.isArray(rows) ? rows : []).map((d) =>
        Array.isArray(d) ? d : (d as { embedding?: number[] } | undefined)?.embedding,
      )
      if (vectors.length !== batch.length) {
        throw new Error(`embedding count mismatch (expected ${batch.length}, got ${vectors.length})`)
      }
      for (let j = 0; j < vectors.length; j++) {
        if (!Array.isArray(vectors[j]) || vectors[j]!.length === 0 || !vectors[j]!.every((n) => Number.isFinite(n))) {
          throw new Error(`embedding vector ${j} malformed or non-finite`)
        }
      }
      return vectors as number[][]
    } catch (err) {
      lastErr = err
      if (attempt === EMBED_ATTEMPTS) break
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[ingest] embed failed (attempt ${attempt}): ${msg}, retrying`)
      await sleep(800 * 2 ** (attempt - 1))
    }
  }
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr)
  throw new Error(`embedding batch failed after ${EMBED_ATTEMPTS} attempts: ${msg}`)
}
