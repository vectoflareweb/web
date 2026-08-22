/**
 * Corpus builder for the AI knowledge index (server-only).
 *
 * Statically imports the full vectoflare corpus, so it must never enter the client
 * bundle or the worker startup graph — it is loaded dynamically by the
 * scheduled index rebuild (src/features/ai/ingest.ts) and tests only.
 */

import { localizePath, type Locale } from '@/features/i18n/locale'
import { pick } from '@/product/content'
import { solutionPages, solutionPath } from '@/product/solution-pages'
import { knowledge } from '@/product/knowledge'
import { projects } from '@/product/projects'
import { seriesPages } from '@/product/series-pages'
import { buildHubEntries } from '@/product/hub-pages'
import { localizedGuides } from '@/features/content/guide-content'
import { STATIC_PAGE_CORPUS_TEXT } from '@/product/ai-content'
import {
  brandify,
  getContentPage,
  getContentPages,
  getContentProducts,
  getCaseUses,
  getNewsPosts,
  getSiteFaqs,
  getTechArticles,
  isContentPageTranslated,
} from '@/features/content/loader'
import { EDGE_REDIRECTS } from '@/features/seo/edge-gate'
import { chunkBody, pageText } from '@/features/content/text'
import { stableHash, makeChunk, type AiChunk } from './rag'
import { SITE_NAME } from '@/config/site'

const FAQ_PATH = '/faq'

/** Stable chunk id per (locale, url, part) — text changes overwrite the same vector. */
const chunkId = (locale: Locale, url: string, part = ''): string =>
  stableHash(`${locale}:${url}#${part}`)

/**
 * All answerable content for one locale, one atomic chunk per piece of
 * information. FAQ entries and solution FAQ blocks are chunked individually —
 * they are the highest-value matches for buyer questions.
 */
export function buildChunks(locale: Locale): AiChunk[] {
  const out: AiChunk[] = []
  const url = (p: string): string => localizePath(locale, p)
  const push = (u: string, title: string, text: string, part = ''): void => {
    const c = makeChunk(u, title, text, chunkId(locale, u, part))
    if (c) out.push(c)
  }

  for (const p of pick(solutionPages, locale)) {
    const u = url(solutionPath(p.slug))
    push(u, p.navLabel, [p.h1, p.answer, ...p.intro, p.scenario.title, p.scenario.body].join('\n'))
    for (const [i, pair] of p.pairs.entries()) {
      push(u, `${p.navLabel} — ${pair.problem}`, `Problem: ${pair.problem}\nSolution: ${pair.solution}`, `pair${i}`)
    }
    for (const [i, f] of p.faqs.entries()) {
      push(u, `${p.navLabel} — FAQ`, `Q: ${f.q}\nA: ${f.a}`, `faq${i}`)
    }
  }

  for (const a of pick(knowledge, locale)) {
    const u = url(`/knowledge/${a.slug}`)
    push(u, a.navLabel, [a.h1, a.intro].join('\n'))
    for (const [i, s] of a.sections.entries()) {
      push(u, a.navLabel, `${s.title}\n${s.body.join('\n')}`, `sec${i}`)
    }
  }

  for (const pr of pick(projects, locale)) {
    const u = url(`/projects/${pr.slug}`)
    push(u, pr.navLabel, [pr.h1, pr.metaDescription, pr.requirement, pr.challenge, pr.solution, pr.result, pr.outcome].join('\n'))
    for (const [i, s] of pr.process.entries()) {
      push(u, `${pr.navLabel} — ${s.title}`, s.body, `step${i}`)
    }
  }

  for (const s of pick(seriesPages, locale)) {
    const u = url(`/products/${s.slug}`)
    push(u, s.navLabel, [s.h1, s.metaDescription, ...s.intro].join('\n'))
    for (const [i, f] of s.faqs.entries()) {
      push(u, `${s.navLabel} — FAQ`, `Q: ${f.q}\nA: ${f.a}`, `faq${i}`)
    }
  }

  for (const g of localizedGuides(locale)) {
    const u = url(`/guides/${g.slug}`)
    push(u, g.title, g.intro.join('\n'))
    for (const [i, s] of g.sections.entries()) {
      push(u, `${g.title} — ${s.title}`, s.body, `sec${i}`)
    }
    for (const [i, f] of g.faqs.entries()) {
      push(u, `${g.title} — FAQ`, `Q: ${f.q}\nA: ${f.a}`, `faq${i}`)
    }
  }

  for (const p of getContentProducts(locale)) {
    const u = url(`/products/${p.slug}`)
    push(u, p.title, [p.summary, p.description].filter(Boolean).join('\n'))
    for (const [i, t] of chunkBody(brandify(p.body)).entries()) push(u, p.title, t, `body${i}`)
  }

  for (const n of getNewsPosts(locale)) {
    const u = url(`/news/${n.slug}`)
    push(u, n.title, n.excerpt ?? '')
    for (const [i, t] of chunkBody(brandify(n.body)).entries()) push(u, n.title, t, `body${i}`)
  }

  for (const t of getTechArticles(locale)) {
    const u = url(`/technology/${t.slug}`)
    push(u, t.title, [t.summary, t.description].filter(Boolean).join('\n'))
    for (const [i, b] of chunkBody(brandify(t.body)).entries()) push(u, t.title, b, `body${i}`)
  }

  for (const c of getCaseUses(locale)) {
    const u = url(`/evidence/case-studies/${c.slug}`)
    push(u, c.title, [c.summary, c.description].filter(Boolean).join('\n'))
    for (const [i, b] of chunkBody(brandify(c.body)).entries()) push(u, c.title, b, `body${i}`)
  }

  // Vectoflare pages carry their own SEO description — good one-chunk answers
  // (product-development, private-label, customizer, trust pages etc.). Full
  // page text is added per-section so deep details are searchable too.
  for (const p of getContentPages()) {
    if (p.path in EDGE_REDIRECTS || p.path === FAQ_PATH) continue
    if (locale === 'es' && !isContentPageTranslated(p.path, 'es')) continue
    const page = locale === 'es' ? getContentPage(p.path, 'es')! : p
    const seo = page.content.seo as { title?: string; description?: string } | undefined
    const title = (seo?.title ?? '').replace(/[|–—-].*$/, '').trim() || page.label
    push(url(p.path), title, seo?.description ?? '')
    for (const [i, t] of chunkBody(brandify(pageText(page.content))).entries()) {
      push(url(p.path), title, t, `body${i}`)
    }
  }

  // Hub pages – structured content compiled in hub-pages.ts
  for (const entry of buildHubEntries(locale)) {
    const u = url(entry.url)
    push(u, 'Hub Page', entry.content ?? '')
  }

  const faqUrl = url(FAQ_PATH)
  for (const [i, f] of getSiteFaqs(locale).entries()) {
    push(faqUrl, f.q, `Q: ${f.q}\nA: ${f.a}`, `faq${i}`)
  }

  // Add a few static pages that may not have structured corpus entries
  // (these will be added for both locales via the rebuildAiIndex loop)
  const staticPages = [
    { path: '/about', title: `About ${SITE_NAME}` },
    { path: '/contact', title: 'Contact' },
    { path: '/terms', title: 'Terms of Service' },
    { path: '/privacy', title: 'Privacy Policy' },
  ]
  for (const sp of staticPages) {
    const u = url(sp.path)
    const txt = ` ${sp.title} page. ${SITE_NAME}${STATIC_PAGE_CORPUS_TEXT}`
    push(u, sp.title, txt)
  }

  return out
}
