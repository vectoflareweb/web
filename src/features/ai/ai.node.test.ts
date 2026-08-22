/**
 * AI assistant core tests (node pool — pure logic + corpus builder).
 * The corpus builder pulls in the full content loader (bundled globs), which
 * the node pool resolves like any other module.
 */
import { describe, expect, test } from 'vitest'
import { buildAskPrompt, makeChunk, matchFaq, matchCorpus, normalizeQuestion, stableHash } from './rag'
import { buildChunks } from './corpus'

describe('stableHash', () => {
  test('is deterministic and unique per input', () => {
    expect(stableHash('en:/faq#faq0')).toBe(stableHash('en:/faq#faq0'))
    expect(stableHash('en:/faq#faq0')).not.toBe(stableHash('es:/faq#faq0'))
    expect(stableHash('a').length).toBeGreaterThan(0)
  })
})

describe('makeChunk', () => {
  test('drops empty text', () => {
    expect(makeChunk('/faq', 't', '   ', 'id1')).toBeNull()
  })
  test('squeezes whitespace and caps length', () => {
    const c = makeChunk('/faq', '  Title  ', 'a\n\n  b '.repeat(2000), 'id2')
    expect(c).not.toBeNull()
    expect(c!.text.length).toBeLessThanOrEqual(3000)
    expect(c!.title).toBe('Title')
  })
})

describe('normalizeQuestion', () => {
  test('lowers case, strips punctuation, keeps letters/numbers', () => {
    expect(normalizeQuestion('  MOQ, for SUP-boards?  ')).toBe('moq for sup boards')
  })
})

describe('buildAskPrompt', () => {
  const chunks = [{ text: 'MOQ starts at 90–100 pcs.', url: '/faq', title: 'MOQ FAQ' }]
  test('embeds question, context and citation instructions', () => {
    const { system, user } = buildAskPrompt({ question: 'What is your MOQ?', chunks })
    expect(system.toLowerCase()).toContain('only')
    expect(system.toLowerCase()).toContain('never invent')
    expect(system).toContain('[1]')
    expect(system).toContain('/faq')
    expect(user).toContain('What is your MOQ?')
  })
  test('includes trimmed history with speaker labels', () => {
    const { user } = buildAskPrompt({
      question: 'And lead time?',
      history: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello!' }],
      chunks,
    })
    expect(user).toContain('Buyer: Hi')
    expect(user).toContain('Assistant: Hello!')
  })
})

describe('matchFaq', () => {
  const faqs = [
    { q: 'Where is your company and factory located?', a: 'We are based in Qingdao, China. A 12,500 m² inflatable manufacturing plant in the Laixi Economic Development Zone, producing since 2012.' },
    { q: 'What is the minimum order quantity (MOQ) for OEM inflatable paddle boards?', a: 'Minimum order quantity is 90–100+ pieces per standard production run.' },
    { q: 'How long does a sample take?', a: 'Samples ship in 7–12 days.' },
    { q: 'What is the lead time for OEM production?', a: 'Standard OEM production lead time is 25–35 days from confirmed PO.' },
    { q: 'What certifications do you hold?', a: 'CE standards and BSCI social compliance certification.' },
    { q: 'Do you offer custom OEM/ODM?', a: 'Full-scale OEM and ODM customization from 3D blueprints to bulk production.' },
  ]
  test('hits the right FAQ by keyword overlap', () => {
    const hit = matchFaq('What is your minimum order quantity?', faqs)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('90–100')
  })
  test('no match for unrelated input', () => {
    expect(matchFaq('quark traversal photon tachyon', faqs)).toBeNull()
  })
  test('ignores short queries', () => {
    expect(matchFaq('hi there', faqs)).toBeNull()
  })
  test('empty faq list returns null', () => {
    expect(matchFaq('What is your minimum order quantity?', [])).toBeNull()
  })
  test('Chinese question about factory location matches English FAQ', () => {
    const hit = matchFaq('工厂地址在哪里', faqs)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('Qingdao')
  })
  test('Chinese question about MOQ matches English FAQ', () => {
    const hit = matchFaq('最低起订量是多少', faqs)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('90–100')
  })
  test('Chinese question about certifications matches English FAQ', () => {
    const hit = matchFaq('有什么认证', faqs)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('CE')
  })
  test('Chinese question with OEM keyword (uppercase) matches English FAQ', () => {
    const hit = matchFaq('可以做OEM吗', faqs)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('OEM')
  })
  test('Chinese question about lead time matches English FAQ', () => {
    const hit = matchFaq('交货期多长', faqs)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('25–35')
  })
})

describe('matchCorpus', () => {
  const chunks = [
    { id: '1', text: 'MOQ for standard volume production starts at 90–100+ pcs per 150 m drop-stitch roll. Pilot batches from 20–50 pcs.', url: '/oem-sup-moq', title: 'Inflatable SUP MOQ' },
    { id: '2', text: 'We hold BSCI, ISO 9001, ISO 25649, CE, REACH and RoHS certifications for our Qingdao factory.', url: '/inflatable-sup-certification', title: 'SUP Certification Guide' },
    { id: '3', text: 'Sample lead time is 7–12 days after artwork confirmation. Production is 25–35 days from confirmed PO.', url: '/faq', title: 'FAQ' },
  ]
  test('matches corpus chunk by keyword overlap', () => {
    const hit = matchCorpus('What certifications do you have?', chunks)
    expect(hit).not.toBeNull()
    expect(hit!.chunk.url).toBe('/inflatable-sup-certification')
    expect(hit!.answer).toContain('BSCI')
  })
  test('matches MOQ question against corpus', () => {
    const hit = matchCorpus('What is your MOQ?', chunks)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('90–100')
  })
  test('no match for unrelated input', () => {
    expect(matchCorpus('quark traversal photon tachyon', chunks)).toBeNull()
  })
  test('ignores short queries', () => {
    expect(matchCorpus('hi there', chunks)).toBeNull()
  })
  test('Chinese question matches English corpus', () => {
    const hit = matchCorpus('有什么认证', chunks)
    expect(hit).not.toBeNull()
    expect(hit!.answer).toContain('BSCI')
  })
})

describe('buildChunks', () => {
  test('en corpus is large and every chunk is well-formed', () => {
    const chunks = buildChunks('en')
    expect(chunks.length).toBeGreaterThan(100)
    for (const c of chunks) {
      expect(c.id.length).toBeGreaterThan(0)
      expect(c.url).toMatch(/^\/(es\/)?/)
      expect(c.title.length).toBeGreaterThan(0)
      expect(c.text.length).toBeGreaterThan(0)
    }
  })
  test('ids are stable across rebuilds (upsert overwrites in place)', () => {
    const a = buildChunks('en')
    const b = buildChunks('en')
    expect(new Set(a.map((c) => c.id))).toEqual(new Set(b.map((c) => c.id)))
    expect(a.length).toBe(b.length)
  })
  test('es corpus exists and urls are locale-prefixed', () => {
    const chunks = buildChunks('es')
    expect(chunks.length).toBeGreaterThan(50)
    for (const c of chunks) expect(c.url.startsWith('/es/')).toBe(true)
  })
  test('includes FAQ chunks pointing at the faq page', () => {
    const chunks = buildChunks('en')
    expect(chunks.some((c) => c.url === '/faq' && c.text.startsWith('Q: '))).toBe(true)
  })
  test('mdx article bodies are chunked (excerpt + multiple body parts)', () => {
    const chunks = buildChunks('en')
    const byUrl = new Map<string, number>()
    for (const c of chunks.filter((c) => c.url.startsWith('/news/'))) {
      byUrl.set(c.url, (byUrl.get(c.url) ?? 0) + 1)
    }
    expect([...byUrl.values()].some((n) => n > 1)).toBe(true)
  })
  test('yaml page section text is chunked (e.g. factory capacity numbers)', () => {
    const chunks = buildChunks('en')
    expect(chunks.some((c) => c.text.includes('12,500'))).toBe(true)
  })
  test('full-body corpus is substantially larger than the summary-only one', () => {
    expect(buildChunks('en').length).toBeGreaterThan(300)
    expect(buildChunks('es').length).toBeGreaterThan(100)
  })
})
