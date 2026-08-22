/**
 * AI assistant fallback coverage (workers pool).
 *
 * The miniflare pool has no AI/Vectorize bindings, so ask() takes the FAQ
 * fallback path — exactly the graceful-degradation contract the widget relies
 * on before the index exists or when the AI stack fails.
 */
import { beforeAll, describe, expect, test } from 'vitest'
import { env } from 'cloudflare:test'
import { ask } from './ask.server'

// The first ask() lazily pulls in the 1.6 MB content loader — warm it in
// beforeAll and keep a generous per-test timeout for the cold case.
beforeAll(async () => {
  await import('@/features/content/loader')
}, 60000)

describe('ask — graceful degradation without AI bindings', () => {
  test('answers an FAQ-shaped question from the site FAQ collection', async () => {
    const res = await ask(env, { question: 'What is your minimum order quantity?', locale: 'en' })
    expect(res.mode).toBe('faq')
    expect(res.answer.length).toBeGreaterThan(0)
    expect(res.sources[0].url).toMatch(/^\/faq#/)
  }, 30000)

  test('returns none (empty answer) when nothing matches', async () => {
    const res = await ask(env, { question: 'quark traversal photon tachyon', locale: 'en' })
    expect(res.mode).toBe('none')
    expect(res.answer).toBe('')
  }, 30000)

  test('caches a computed answer in KV', async () => {
    const res = await ask(env, { question: 'How long does a sample take?', locale: 'en' })
    expect(res.mode).toBe('faq')
    const again = await ask(env, { question: 'How long does a sample take?', locale: 'en' })
    expect(again.mode).toBe('faq')
  }, 30000)

  test('empty question short-circuits', async () => {
    const res = await ask(env, { question: '   ' })
    expect(res.mode).toBe('none')
  })
})
