import { test, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getContentPages } from '@/features/content/loader'
import { gatePath } from '@/features/seo/edge-gate'

const routesRoot = resolve(process.cwd(), 'src/routes')
const groupRoot = join(routesRoot, '{-$locale}')

const routeName = (f: string): string | null => {
  if (!f.endsWith('.tsx')) return null
  if (f.endsWith('.lazy.tsx')) return null
  const name = f.slice(0, -4)
  if (name.includes('.') || name.includes('$')) return null
  if (name === 'index') return null
  return name
}

/** Dedicated root routes (`factory.tsx` �?`/factory`) that outrank the `{- $locale}` group. */
const rootRoutes = readdirSync(routesRoot)
  .map(routeName)
  .filter((n): n is string => n != null)
  .map((n) => `/${n}`)

/** Direct `{- $locale}` children that also match bare single-segment URLs with locale=undefined. */
const localeGroupChildren = readdirSync(groupRoot)
  .map(routeName)
  .filter((n): n is string => n != null)
  .map((n) => `/${n}`)

const singleSegmentPages = getContentPages()
  .map((p) => p.path)
  .filter((p) => p !== '/' && !p.slice(1).includes('/'))

test('every single-segment vectoflare page has a serving route (P0 regression guard)', () => {
  expect(singleSegmentPages.length).toBeGreaterThan(0)
  for (const p of singleSegmentPages) {
    // The optional `{- $locale}` group terminates on a bare segment BEFORE the
    // root `/$` catch-all is considered, so single-segment registry pages must
    // be covered by a dedicated root route (contentSingleRoute), a `{- $locale}`
    // child (locale=undefined), or an edge-gate redirect/410.
    const covered = rootRoutes.includes(p) || localeGroupChildren.includes(p) || gatePath(p).action !== 'ok'
    expect(covered, `${p} would 404 through the {- $locale} group �?add a dedicated route via contentSingleRoute`).toBe(true)
  }
})

test('oem-moq-guide regression: bare EN path served by a dedicated route', () => {
  expect(rootRoutes).toContain('/oem-moq-guide')
  expect(singleSegmentPages).toContain('/oem-moq-guide')
})