import { test, expect } from 'vitest'
import {
  getContentProducts,
  getContentProduct,
  getContentPage,
  getNewsPosts,
  getNewsPost,
  getTechArticles,
  getTechArticle,
  getCaseUses,
  getCaseUse,
  getResearchTopics,
  hasLocaleVariant,
  getLocaleContentPaths,
  getPublicPaths,
  getLocalePaths,
} from '@/features/content/loader'
import { getGuide } from '@/features/content/guide-content'
import { buildExtendedIndex, buildFullIndex } from '@/features/site/search-index.server'

test('products: es overlay swaps title and keeps canonical slug', () => {
  const en = getContentProduct('sup-cheetah-surge')
  const es = getContentProduct('sup-cheetah-surge', 'es')
  expect(en).toBeDefined()
  expect(es).toBeDefined()
  expect(es?.slug).toBe(en?.slug)
  // Brand names stay identical across locales; the Spanish body/description must not.
  expect(es?.description?.length).toBeGreaterThan(0)
  expect(es?.description).not.toBe(en?.description)
  expect(es?.body.length).toBeGreaterThan(500)
})

test('products: es collection mirrors en slugs 1:1', () => {
  const en = getContentProducts()
  const es = getContentProducts('es')
  expect(es).toHaveLength(en.length)
  expect(es.map((p) => p.slug)).toEqual(en.map((p) => p.slug))
  const translated = es.filter((p, i) => p.body !== en[i].body)
  expect(translated.length).toBeGreaterThan(0)
})

test('products: en locale and unknown slugs fall back to English content', () => {
  expect(getContentProduct('sup-cheetah-surge', 'en')?.title).toBe(getContentProduct('sup-cheetah-surge')?.title)
  expect(getContentProduct('no-such-board', 'es')).toBeUndefined()
})

test('news: es overlay translates posts, canonical slug preserved', () => {
  const en = getNewsPosts()
  const es = getNewsPosts('es')
  expect(es).toHaveLength(en.length)
  const any = es.filter((p, i) => p.title !== en[i].title)
  expect(any.length).toBeGreaterThan(0)
  const post = getNewsPost('drop-stitch-2-0', 'es')
  expect(post?.slug).toBe('drop-stitch-2-0')
  expect(post?.title).not.toBe(getNewsPost('drop-stitch-2-0')?.title)
})

test('technology: es overlay swaps title and keeps slug', () => {
  const en = getTechArticle('military-grade-pvc')
  const es = getTechArticle('military-grade-pvc', 'es')
  expect(es?.slug).toBe('military-grade-pvc')
  expect(es?.title).not.toBe(en?.title)
  expect(es?.body.length).toBeGreaterThan(100)
  expect(getTechArticles('es')).toHaveLength(getTechArticles().length)
})

test('case-use: es overlay swaps title and keeps slug', () => {
  const en = getCaseUse('beginner-sup-training')
  const es = getCaseUse('beginner-sup-training', 'es')
  expect(es?.slug).toBe('beginner-sup-training')
  expect(es?.title).not.toBe(en?.title)
  expect(getCaseUses('es')).toHaveLength(getCaseUses().length)
})

test('guides: es variants exist for every guide slug', () => {
  for (const g of ['how-to-choose-your-sup', 'beginner-guide', 'inflatable-vs-hard', 'safety-tips']) {
    const es = getGuide(`/guides/${g}`, 'es')
    expect(es, g).toBeDefined()
    expect(es?.title).not.toBe(getGuide(`/guides/${g}`)?.title)
  }
  expect(getGuide('/guides/how-to-choose-your-sup', 'en')?.title).toBe(getGuide('/guides/how-to-choose-your-sup')?.title)
})

test('research topics: es localization swaps category/readTime labels', () => {
  const en = getResearchTopics()
  const es = getResearchTopics('es')
  expect(es).toHaveLength(en.length)
  expect(es.map((t) => t.slug)).toEqual(en.map((t) => t.slug))
  expect(es[0]?.category).not.toBe(en[0]?.category)
  expect(es[0]?.readTime).toMatch(/min de lectura/)
})

test('hasLocaleVariant covers registry, faq and sidecar content', () => {
  expect(hasLocaleVariant('/faq', 'es')).toBe(true)
  expect(hasLocaleVariant('/products/sup-cheetah-surge', 'es')).toBe(true)
  expect(hasLocaleVariant('/news/drop-stitch-2-0', 'es')).toBe(true)
  expect(hasLocaleVariant('/technology/military-grade-pvc', 'es')).toBe(true)
  expect(hasLocaleVariant('/evidence/case-studies/beginner-sup-training', 'es')).toBe(true)
  expect(hasLocaleVariant('/products/does-not-exist', 'es')).toBe(false)
})

test('product-development page: registered EN+ES with structured sections', () => {
  const en = getContentPage('/product-development')
  expect(en).toBeDefined()
  expect(en!.meta?.title).toContain('SUP Product Development')
  const types = en!.sections.map((s) => s.type)
  expect(types).toContain('hero')
  expect(types).toContain('faqs')
  expect(types).toContain('cta')
  const esPage = getContentPage('/product-development', 'es')
  expect(esPage?.meta?.title).not.toBe(en?.meta?.title)
  expect(hasLocaleVariant('/product-development', 'es')).toBe(true)
  expect(getPublicPaths()).toContain('/product-development')
  expect(getLocalePaths('es')).toContain('/product-development')
})

test('oem-trust-assurance page: registered EN+ES with structured sections', () => {
  const en = getContentPage('/oem-trust-assurance')
  expect(en).toBeDefined()
  expect(en!.meta?.title).toContain('OEM Trust')
  const types = en!.sections.map((s) => s.type)
  expect(types).toContain('hero')
  expect(types).toContain('stats')
  expect(types).toContain('features')
  expect(types).toContain('steps')
  expect(types).toContain('faqs')
  expect(types).toContain('content')
  expect(types).toContain('cta')
  const faqItems = (en!.content.trust_faqs?.items ?? []) as { q?: string; a?: string }[]
  expect(faqItems).toHaveLength(12)
  expect(faqItems.every((f) => f.q && f.a)).toBe(true)
  const stats = en!.content.trust_stats as { value?: string }[]
  expect(stats.some((s) => s.value === '18,0 PSI' || s.value === '18.0 PSI')).toBe(true)
  const esPage = getContentPage('/oem-trust-assurance', 'es')
  expect(esPage).toBeDefined()
  expect(esPage!.meta?.title).toContain('Confianza')
  expect(esPage!.meta?.title).not.toBe(en!.meta?.title)
  expect(hasLocaleVariant('/oem-trust-assurance', 'es')).toBe(true)
  expect(getPublicPaths()).toContain('/oem-trust-assurance')
  expect(getLocalePaths('es')).toContain('/oem-trust-assurance')
})

test('getLocaleContentPaths lists every es sidecar detail path', () => {
  const paths = getLocaleContentPaths('es')
  expect(paths.length).toBeGreaterThanOrEqual(18)
  expect(paths).toContain('/products/sup-cheetah-surge')
  expect(paths).toContain('/news/drop-stitch-2-0')
  expect(paths).toContain('/technology/drop-stitch-core')
  expect(paths).toContain('/evidence/case-studies/coastal-touring')
  expect(paths.every((p) => /^\/[a-z-]+\//.test(p))).toBe(true)
})

test('search index: es detail content indexed under /es urls with Spanish copy', () => {
  const es = buildExtendedIndex('es')
  expect(es.some((e) => e.url === '/es/products/sup-cheetah-surge' && e.title.length > 0)).toBe(true)
  expect(es.some((e) => e.url === '/es/guides/how-to-choose-your-sup')).toBe(true)
  expect(es.some((e) => e.url === '/es/news/drop-stitch-2-0')).toBe(true)
  expect(es.some((e) => e.url === '/es/evidence/case-studies/coastal-touring')).toBe(true)
  expect(es.filter((e) => e.locale === 'es').length).toBeGreaterThan(10)
})

test('search index: es index never links bare en urls', () => {
  const es = buildExtendedIndex('es')
  expect(es.every((e) => !e.url.startsWith('/es') || e.locale === 'es')).toBe(true)
  expect(es.some((e) => e.locale === 'en')).toBe(false)
})

test('search index: en and es twins both present in the full index', () => {
  const urls = new Set(buildFullIndex().map((e) => e.url))
  expect(urls.has('/products/sup-cheetah-surge')).toBe(true)
  expect(urls.has('/es/products/sup-cheetah-surge')).toBe(true)
  expect(urls.has('/faq')).toBe(true)
  expect(urls.has('/es/faq')).toBe(true)
})
