import { products } from '@/product/content'
import { solutionPages, solutionPath } from '@/product/solution-pages'
import { projects } from '@/product/projects'
import { knowledge } from '@/product/knowledge'
import {
  getContentPages,
  getContentProducts,
  getNewsPosts,
  getTechArticles,
  getCaseUses,
  getResearchTopics,
  getGeoFacts,
  getSiteFaqs,
  brandify,
} from '@/features/content/loader'
import { GUIDES_ES } from '@/features/content/guide-content'
import { FACTS, COLLABORATION_MODES } from '@/product/facts'
import { EDGE_REDIRECTS } from '@/features/seo/edge-gate'
import { LEGACY_REDIRECTS } from '@/features/seo/legacy-redirects'
import { SITE_NAME } from '@/config/site'
import { PAGE_TITLES } from '@/product/entity-data'
import { LLM_SITE_DESCRIPTION, LLM_FAQ_DESCRIPTION, LLM_SPANISH_HOMEPAGE_DESCRIPTION, LLM_FACT_BLOCK } from '@/product/ai-content'
import { GLOSSARY } from '@/product/glossary'

const flat = (text: string) => text.replace(/\s+/g, ' ').trim()

const mdBody = (body: string) => body.split('\n').map((l) => l.trim()).filter(Boolean)

/** Recursive bullet renderer for the structured geo facts (arrays → comma lists). */
function fmt(v: unknown, key: string, depth = 0): string[] {
  const pad = '  '.repeat(depth)
  const label = key.replace(/_/g, ' ')
  if (Array.isArray(v)) return [`${pad}- ${label}: ${v.map(String).join(', ')}`]
  if (v && typeof v === 'object') {
    const inner = Object.entries(v).flatMap(([k, val]) => fmt(val, k, depth + 1))
    return [`${pad}- ${label}:`, ...inner]
  }
  return [`${pad}- ${label}: ${String(v)}`]
}

function factsSection(title: string, facts?: Record<string, unknown>): string[] {
  if (!facts || Object.keys(facts).length === 0) return []
  return ['', `## ${title}`, '', ...Object.entries(facts).flatMap(([k, v]) => fmt(v, k))]
}

/**
 * `/llms-full.txt` opening card — concrete company facts instead of a generic
 * template intro, so LLMs answer GEO questions with verifiable numbers.
 */
export function llmSiteHeader(): string {
  const { company, certifications, manufacturing } = getGeoFacts()
  const glossaryEntries = GLOSSARY.filter((g) => g.locale === 'en')
  const glossaryBlock = glossaryEntries.length > 0
    ? ['', '## Industry Glossary', '', ...glossaryEntries.map((g) => `- **${g.term}**: ${g.short}`)]
    : []
  const collaborationLines = Object.entries(COLLABORATION_MODES).flatMap(([key, mode]) => [
    `- **${key.toUpperCase()}**: ${mode.short}`,
    `  Full: ${mode.full}`,
    `  Best for: ${mode.bestFor}`,
  ])
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${LLM_SITE_DESCRIPTION.replaceAll('{SITE}', SITE_NAME)}`,
    LLM_FACT_BLOCK.replaceAll('{SITE}', SITE_NAME),
    '',
    '## MOQ Note',
    FACTS.moqNote,
    '',
    '## MOQ Explanation',
    `- Sample: ${FACTS.moqExplanation.sample}`,
    `- Co-branding: ${FACTS.moqExplanation.coBrand}`,
    `- Pilot: ${FACTS.moqExplanation.pilot}`,
    `- Standard: ${FACTS.moqExplanation.standard}`,
    `- Custom mould: ${FACTS.moqExplanation.customMould}`,
    '',
    '## Material Roll Note',
    FACTS.materialRollNote,
    '',
    '## Collaboration Modes',
    ...collaborationLines,
    ...factsSection('Company Facts', company),
    ...factsSection('Certifications', certifications),
    ...factsSection('Manufacturing', manufacturing),
    ...glossaryBlock,
    '',
  ].join('\n')
}

export function llmProductsIndex(origin: string): string {
  // Real product detail pages exist for the ported vectoflare products — link each
  // entry to its page instead of the /products index.
  const lines = getContentProducts().map((p) => `- [${p.title}](${abs(origin, `/products/${p.slug}`)}): ${flat(p.summary ?? '')}`)
  return ['', '## Products', ...lines, ''].join('\n')
}

export function llmProductsFull(): string {
  const blocks = products.en.items.map((p) =>
    [
      `## ${p.name} (${p.sku})`,
      '',
      flat(p.desc),
      '',
      `- Specs: ${flat(p.specs)}`,
      `- Artwork & construction: ${flat(p.artwork)}`,
      `- Recommended for: ${p.for.join(', ')}`,
    ].join('\n'),
  )
  return ['', '# Products', '', blocks.join('\n\n'), ''].join('\n')
}

/** Index entries for the Solutions system pages (in /llms.txt). */
export function llmSolutionsIndex(origin: string): string {
  const lines = solutionPages.en.map((p) => `- [${p.metaTitle}](${abs(origin, solutionPath(p.slug))}): ${flat(p.metaDescription)}`)
  return ['', '## Solution Pages', ...lines, ''].join('\n')
}

/** Index entries for the project case studies (in /llms.txt). */
export function llmProjectsIndex(origin: string): string {
  const lines = projects.en.map((p) => `- [${p.metaTitle}](${abs(origin, `/projects/${p.slug}`)}): ${flat(p.metaDescription)}`)
  return ['', '## Projects', ...lines, ''].join('\n')
}

/** Index entries for the Knowledge Center articles (in /llms.txt). */
export function llmKnowledgeIndex(origin: string): string {
  const lines = knowledge.en.map((a) => `- [${a.metaTitle}](${abs(origin, `/knowledge/${a.slug}`)}): ${flat(a.metaDescription)}`)
  return ['', '## Knowledge Center', ...lines, ''].join('\n')
}

/** Full text for the project case studies (in /llms-full.txt). */
export function llmProjectsFull(): string {
  const blocks = projects.en.map((p) =>
    [
      `# ${p.h1}`,
      '',
      ...p.intro.map(flat),
      '',
      `Industry: ${p.industry}`,
      '',
      `Requirement: ${flat(p.requirement)}`,
      '',
      `Challenge: ${flat(p.challenge)}`,
      '',
      `Solution: ${flat(p.solution)}`,
      '',
      `Product: ${flat(p.product)}`,
      '',
      '## Process',
      ...p.process.map((s) => `- ${s.title}: ${flat(s.body)}`),
      '',
      `## Result`,
      flat(p.result),
      '',
      `Outcome: ${flat(p.outcome)}`,
      '',
      `Tags: ${p.tags.join(', ')}`,
    ].join('\n'),
  )
  return ['', '# Projects', ...blocks].join('\n\n')
}

/** Full text for the Knowledge Center articles (in /llms-full.txt). */
export function llmKnowledgeFull(): string {
  const blocks = knowledge.en.map((a) =>
    [`# ${a.h1}`, '', flat(a.intro), ...a.sections.flatMap((s) => ['', `## ${s.title}`, '', ...s.body.map(flat)])].join('\n'),
  )
  return ['', '# Knowledge Center', ...blocks].join('\n\n')
}

/** Full text for the Solutions system pages incl. their FAQ Q&A (in /llms-full.txt). */
export function llmSolutionsFull(): string {
  const blocks = solutionPages.en.map((p) =>
    [
      `# ${p.h1}`,
      '',
      ...p.intro.map(flat),
      '',
      `Scenario: ${flat(p.scenario.body)}`,
      '',
      '## Problems & Solutions',
      ...p.pairs.flatMap((pair) => [`- Problem: ${flat(pair.problem)}`, `- Solution: ${flat(pair.solution)}`]),
      '',
      '## Process',
      ...p.steps.map((s) => `- ${s.title}: ${flat(s.body)}`),
      '',
      '## Case Study',
      `- ${p.caseStudy.title}: ${flat(p.caseStudy.body)}`,
      '',
      '## FAQ',
      ...p.faqs.flatMap((f) => [`### Q: ${f.q}`, '', f.a, '']),
    ].join('\n'),
  )
  return ['', ...blocks].join('\n\n')
}

/* ─────────────────────────── vectoflare (GEO/AI) ─────────────────────────── */

/** `/llms.txt` index sections link to absolute URLs (llmstxt.org) so LLMs can explore directly. */
const abs = (origin: string, path: string) => `${origin}${path}`

/** Index entries for the ported vectoflare brand pages (in /llms.txt). */
export function llmsIndex(origin: string): string {
  // Derived from the loader (not a hand-maintained list) so revived pages and
  // future registry additions are covered automatically. Edge/legacy-301'd
  // source paths must not appear as canonical URLs — same rule as the sitemap.
  const pageLines = getContentPages()
    .filter((p) => !(p.path in EDGE_REDIRECTS) && !(p.path in LEGACY_REDIRECTS))
    .map((p) => `- [${PAGE_TITLES[p.path] ?? brandify(p.label)}](${abs(origin, p.path)}): ${flat(brandify(p.meta?.description ?? ''))}`)
  const staticLines = [
    `- [FAQ](${abs(origin, '/faq')}): ${LLM_FAQ_DESCRIPTION}`,
  ]
  const resolvedResearch = new Set(getContentPages().map((p) => p.path))
  const researchLines = getResearchTopics()
    .filter((t) => resolvedResearch.has(`/research/${t.slug}`))
    .map((t) => `- [Research: ${t.slug.replace(/-/g, ' ')}](${abs(origin, `/research/${t.slug}`)}): ${t.category}, ${t.readTime}`)
  const newsLines = getNewsPosts()
    .slice(0, 10)
    .map((p) => `- [${p.title}](${abs(origin, `/news/${p.slug}`)}): ${flat(p.excerpt ?? '')}`)
  return [
    '',
    '## Factory, Technology & Resources',
    ...pageLines,
    '',
    '## FAQ',
    ...staticLines,
    '',
    '## Research',
    ...researchLines,
    '',
    '## Latest News',
    ...newsLines,
    '',
  ].join('\n')
}

/** Full text for the vectoflare factory/technology pages + products + articles. */
export function llmsFactoryFull(): string {
  const DEEP_PAGES = new Set([
    '/factory', '/quality', '/oem-moq-guide', '/sup-oem-moq-lead-time',
    '/oem-sup-moq', '/inflatable-sup-certification', '/oem-trust-assurance',
    '/proof-center', '/oem-odm-private-label-comparison',
    '/factory/capacity', '/factory/equipment', '/factory/oem-capability',
    '/factory/process', '/factory/quality-lab', '/factory/quality-inspection',
    '/factory/quality-change-control', '/factory/non-conforming-control',
    '/odm-development', '/oem-manufacturing', '/oem-paddle',
    '/new-brand-trial-order', '/b2b-solutions-matrix',
    '/sup-construction-comparison', '/sup-compliance-by-market',
    '/factory-audit-checklist', '/about/identity', '/about/vectoflare',
    '/partners', '/news', '/technology', '/size-guide',
    '/fishing', '/inflatable-vs-hardboard', '/tourism-recreation',
    '/warranty', '/what-is-sup',
    '/solutions/rental-operators', '/solutions/retail-partners', '/solutions/distributors',
    '/randdcenter', '/randdcenter/hull-engineering', '/randdcenter/hydrodynamic-test-tank',
    '/randdcenter/prototype-workshop', '/randdcenter/pvc-fabric-lab',
    '/randdcenter/quality-inspection-lab', '/randdcenter/rf-welding',
    '/research/drop-stitch-technology', '/research/pvc-vs-hypalon',
    '/research/ce-certification-guide', '/research/sup-thickness-guide',
    '/research/oem-buyer-guide',
    '/oem/sup-oem-north-america', '/oem/sup-oem-europe',
    '/oem/sup-oem-australia', '/oem/sup-oem-canada',
  ])

  function pageBodyText(p: { path: string; content?: Record<string, unknown> }): string[] {
    const c = p.content
    if (!c || typeof c !== 'object') return []
    const lines: string[] = []
    for (const [key, val] of Object.entries(c)) {
      if (key === 'meta' || key === 'evidence_review') continue
      if (typeof val === 'string') { lines.push(flat(val)); continue }
      if (typeof val !== 'object' || !val) continue
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string') { lines.push(flat(item)); continue }
          if (typeof item === 'object' && item) {
            const obj = item as Record<string, unknown>
            for (const v of Object.values(obj)) {
              if (typeof v === 'string') lines.push(flat(v))
              else if (Array.isArray(v)) for (const s of v) if (typeof s === 'string') lines.push(flat(s))
            }
          }
        }
        continue
      }
      const obj = val as Record<string, unknown>
      for (const v of Object.values(obj)) {
        if (typeof v === 'string') lines.push(flat(v))
        else if (Array.isArray(v)) for (const s of v) if (typeof s === 'string') lines.push(flat(s))
      }
    }
    return lines
  }
  // Edge-301'd source paths (/brand/vectoflare, /brand/story, /oem-odm, …) and
  // legacy thevectoflare-era paths must not appear as canonical URLs in the LLM
  // corpus — same rule as the sitemap.
  const pageBlocks = getContentPages()
    .filter((p) => !(p.path in EDGE_REDIRECTS) && !(p.path in LEGACY_REDIRECTS))
    .map((p) => {
      const isDeep = DEEP_PAGES.has(p.path)
      const bodyLines = isDeep ? pageBodyText(p) : []
      if (isDeep && bodyLines.length > 0) {
        return [`# ${brandify(p.label)}`, '', flat(brandify(p.meta?.description ?? '')), '', `URL: ${p.path}`, '', ...bodyLines].join('\n')
      }
      return [`# ${brandify(p.label)}`, '', flat(brandify(p.meta?.description ?? '')), '', `URL: ${p.path}`].join('\n')
    })
  const productBlocks = getContentProducts().map((p) =>
    [
      `## Product: ${p.title}${p.sku ? ` (${p.sku})` : ''}`,
      '',
      flat(p.summary ?? ''),
      ...(p.specs ?? []).map((s) => `- ${s.label}: ${s.value}`),
      '',
      ...mdBody(p.body),
    ].join('\n'),
  )
  const newsBlocks = getNewsPosts().map((p) =>
    [`## News: ${p.title}`, '', p.date.slice(0, 10), flat(p.excerpt ?? ''), '', ...mdBody(p.body)].join('\n'),
  )
  const techBlocks = getTechArticles().map((a) =>
    [`## Technology: ${a.title}`, '', flat(a.summary ?? ''), '', ...mdBody(a.body)].join('\n'),
  )
  const caseBlocks = getCaseUses().map((c) => [`## Case Study: ${c.title}`, '', flat(c.summary ?? ''), ...mdBody(c.body)].join('\n'))
  const { company, certifications, manufacturing } = getGeoFacts()
  return [
    '',
    `# ${SITE_NAME} Brand Site`,
    ...pageBlocks,
    ...factsSection('Company Facts', company),
    ...factsSection('Certifications', certifications),
    ...factsSection('Manufacturing', manufacturing),
    '',
    '# Products',
    ...productBlocks,
    '',
    '# News',
    ...newsBlocks,
    '',
    '# Technology',
    ...techBlocks,
    '',
    '# Case Studies',
    ...caseBlocks,
    '',
  ].join('\n\n')
}

/** `/llms.txt` Spanish section — absolute /es URLs so LLMs can ingest the mirror directly. */
export function llmSpanishIndex(origin: string): string {
  const es = (path: string) => abs(origin, `/es${path}`)
  const productLines = getContentProducts('es').map((p) => `- [${p.title}](${es(`/products/${p.slug}`)}): ${flat(p.summary ?? '')}`)
  const techLines = getTechArticles('es').map((a) => `- [${a.title}](${es(`/technology/${a.slug}`)}): ${flat(a.summary ?? '')}`)
  const caseLines = getCaseUses('es').map((c) => `- [${c.title}](${es(`/evidence/case-studies/${c.slug}`)}): ${flat(c.summary ?? '')}`)
  const guideLines = GUIDES_ES.map((g) => `- [${g.title}](${es(`/guides/${g.slug}`)}): ${flat(g.intro[0] ?? '')}`)
  const newsLines = getNewsPosts('es')
    .slice(0, 10)
    .map((p) => `- [${p.title}](${es(`/news/${p.slug}`)}): ${flat(p.excerpt ?? '')}`)
  const faqLines = getSiteFaqs('es')
    .slice(0, 6)
    .map((f) => `- ${f.q}`)
  return [
    '',
    '## Español',
    '',
    `- [${SITE_NAME} — inicio](${es('/')}): ${LLM_SPANISH_HOMEPAGE_DESCRIPTION}`,
    '',
    '### Español: Productos',
    ...productLines,
    '',
    '### Español: Tecnología',
    ...techLines,
    '',
    '### Español: Casos de estudio',
    ...caseLines,
    '',
    '### Español: Guías',
    ...guideLines,
    '',
    '### Español: Noticias',
    ...newsLines,
    '',
    '### Español: Preguntas frecuentes',
    ...faqLines,
    '',
  ].join('\n')
}

/** Full Spanish text for products, news, tech, cases and guides (in /llms-full.txt). */
export function llmsFactorySpanishFull(): string {
  const productBlocks = getContentProducts('es').map((p) =>
    [
      `## Producto: ${p.title}${p.sku ? ` (${p.sku})` : ''}`,
      '',
      flat(p.summary ?? ''),
      ...(p.specs ?? []).map((s) => `- ${s.label}: ${s.value}`),
      '',
      ...mdBody(p.body),
    ].join('\n'),
  )
  const newsBlocks = getNewsPosts('es').map((p) =>
    [`## Noticia: ${p.title}`, '', p.date.slice(0, 10), flat(p.excerpt ?? ''), '', ...mdBody(p.body)].join('\n'),
  )
  const techBlocks = getTechArticles('es').map((a) =>
    [`## Tecnología: ${a.title}`, '', flat(a.summary ?? ''), '', ...mdBody(a.body)].join('\n'),
  )
  const caseBlocks = getCaseUses('es').map((c) => [`## Caso de estudio: ${c.title}`, '', flat(c.summary ?? ''), ...mdBody(c.body)].join('\n'))
  const guideBlocks = GUIDES_ES.map((g) =>
    [
      `# Guía: ${g.title}`,
      '',
      flat(g.intro.join(' ')),
      ...g.sections.flatMap((s) => ['', `## ${s.title}`, '', s.body]),
      '',
      '## FAQ',
      ...g.faqs.flatMap((f) => [`### Q: ${f.q}`, '', f.a, '']),
    ].join('\n'),
  )
  return [
    '',
    '# Español',
    ...productBlocks,
    '',
    '# Español: Noticias',
    ...newsBlocks,
    '',
    '# Español: Tecnología',
    ...techBlocks,
    '',
    '# Español: Casos de estudio',
    ...caseBlocks,
    '',
    '# Español: Guías',
    ...guideBlocks,
    '',
  ].join('\n\n')
}
