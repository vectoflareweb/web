import { test, expect } from 'vitest'
import { getContentPages, getContentPage } from '@/features/content/loader'
import { ContentSections } from '@/features/content/render/sections'
import { I18nProvider } from '@/features/i18n/provider'
import * as React from 'react'
import { renderToString } from 'react-dom/server'

/**
 * Audits that every registry section with non-trivial content actually renders
 * non-empty markup when rendered in isolation. Catches section shapes (bare
 * arrays, unhandled keys) that silently fall through ContentWidget/FeatureGrid
 * and produce zero output on the live page.
 */

test('every registry section with content renders non-empty markup', { timeout: 30_000 }, () => {
  const problems: string[] = []
  for (const page of getContentPages()) {
    for (const def of page.sections) {
      const c = (page.content as Record<string, unknown>)[def.key]
      if (c == null || c === '') continue
      for (const locale of ['en', 'es'] as const) {
        const es = getContentPage(page.path, locale)
        if (!es) continue
        const single = { ...es, sections: [def] }
        const out = renderToString(
          React.createElement(I18nProvider, { locale, children: React.createElement(ContentSections, { page: single }) }),
        )
        if (out.trim().length === 0) {
          problems.push(`${page.path} → ${def.key} (type=${def.type}, ${locale}) renders empty`)
        }
      }
    }
  }
  expect(problems, `silently-missing sections:\n${problems.join('\n')}`).toEqual([])
})

test('every es twin keeps every section that its en twin renders', { timeout: 15_000 }, () => {
  const problems: string[] = []
  for (const page of getContentPages()) {
    const en = getContentPage(page.path, 'en')
    const es = getContentPage(page.path, 'es')
    if (!en || !es) continue
    for (const def of page.sections) {
      const enC = (en.content as Record<string, unknown>)[def.key]
      if (enC == null || enC === '') continue
      const esC = (es.content as Record<string, unknown>)[def.key]
      if (esC == null || esC === '') {
        problems.push(`${page.path} → ${def.key} (${page.slug}): present in en, missing in es twin`)
      }
    }
  }
  expect(problems, `es twins missing sections:\n${problems.join('\n')}`).toEqual([])
})
