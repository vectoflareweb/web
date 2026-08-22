import { test, expect } from 'vitest'
import { llmsFactoryFull, llmsIndex } from '@/features/site/llm'
import { getContentPages } from '@/features/content/loader'
import { EDGE_REDIRECTS } from '@/features/seo/edge-gate'
import { LEGACY_REDIRECTS } from '@/features/seo/legacy-redirects'

const urlLines = (text: string): Set<string> => {
  const paths = new Set<string>()
  for (const m of text.matchAll(/^URL: (.+)$/gm)) paths.add(m[1])
  return paths
}

const indexPaths = (text: string): Set<string> => {
  const paths = new Set<string>()
  for (const m of text.matchAll(/^- \[[^\]]+\]\(([^)]+)\):/gm)) paths.add(m[1])
  return paths
}

const SHADOWED = new Set([...Object.keys(EDGE_REDIRECTS), ...Object.keys(LEGACY_REDIRECTS)])

test('llms-full.txt contains every live vectoflare page (no truncation regression)', () => {
  const full = llmsFactoryFull()
  const urls = urlLines(full)
  const expected = getContentPages()
    .filter((p) => !SHADOWED.has(p.path))
    .map((p) => p.path)
  for (const path of expected) {
    expect(urls, `llms-full.txt missing live page ${path}`).toContain(path)
  }
  expect(expected.length).toBeGreaterThan(30)
})

test('llms-full.txt never advertises edge-301 or legacy-shadowed paths', () => {
  const urls = urlLines(llmsFactoryFull())
  for (const shadowed of SHADOWED) {
    expect(urls, `llms-full.txt must not contain shadowed path ${shadowed}`).not.toContain(shadowed)
  }
})

test('llms.txt vectoflare index covers every live page and no shadowed paths', () => {
  const index = llmsIndex('https://vectoflare.com')
  const listed = indexPaths(index)
  const live = getContentPages().map((p) => `${index.includes('https://vectoflare.com') ? 'https://vectoflare.com' : ''}${p.path}`)

  // Coverage via the path portion (index links are now absolute URLs).
  const listedPaths = new Set([...listed].map((u) => (u.startsWith('https://') ? new URL(u).pathname : u)))
  for (const path of live.map((p) => (p.startsWith('https://') ? new URL(p).pathname : p))) {
    if (SHADOWED.has(path)) {
      expect(listedPaths, `llms.txt index must not list shadowed path ${path}`).not.toContain(path)
    } else {
      expect(listedPaths, `llms.txt index missing live page ${path}`).toContain(path)
    }
  }
})
