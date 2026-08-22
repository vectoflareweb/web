import { test, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import * as React from 'react'
import { getContentPage, getContentPages, getLocalePaths } from '@/features/content/loader'
import { ContentSections } from '@/features/content/render/sections'
import { I18nProvider } from '@/features/i18n/provider'

const html = (path: string, locale: 'en' | 'es' = 'en'): string => {
  const page = getContentPage(path, locale)
  expect(page, `${path} not found in registry`).toBeTruthy()
  return renderToString(
    React.createElement(
      I18nProvider,
      { locale, children: React.createElement(ContentSections, { page: page! }) },
    ),
  )
}

test('every registry page renders its sections without error (en)', () => {
  for (const p of getContentPages()) {
    expect(() => html(p.path), `${p.path} throws during render`).not.toThrow()
  }
})

test('every Spanish twin renders without error (es)', () => {
  // /faq is served by the catchall route from site/faqs.yaml, not the registry.
  for (const p of getLocalePaths('es').filter((x) => x !== '/faq')) {
    expect(() => html(p, 'es'), `${p} (es) throws during render`).not.toThrow()
  }
})

test('factory intelligence cards render (bare array shape)', () => {
  const out = html('/factory')
  for (const t of ['Production Capacity', 'Quality Lab &amp; Testing', '7-Stage Quality Control Flow']) {
    expect(out, `factory card "${t}" not rendered`).toContain(t)
  }
})

test('/quality renders all 7 inspection gates and the documentation samples', () => {
  const out = html('/quality')
  for (const t of [
    'Project Quality Planning (PPM)',
    'Incoming Material Inspection (IQC)',
    'In-Process Control &amp; First Article (IPQC / FAI)',
    'Inflation &amp; Air-Tightness Testing',
    'Final Product Inspection (FQC)',
    'Packaging &amp; Pre-Shipment Inspection (PSI)',
    'Shipment Release &amp; Traceability',
  ]) {
    expect(out, `gate "${t}" not rendered`).toContain(t)
  }
  expect(out).toContain('Quality Records That Support Project Traceability')
  expect(out).toContain('Incoming Material Inspection Record')
  expect(out).toContain('Download QIP (PDF)')
  expect(out).toContain('Download release reports (PDF)')
})

test('/quality es twin renders gates in Spanish', () => {
  const out = html('/quality', 'es')
  for (const t of [
    'Planificación de calidad del proyecto (PPM)',
    'Liberación de envío y trazabilidad',
    'Registros de calidad que respaldan la trazabilidad del proyecto',
  ]) {
    expect(out, `es gate "${t}" not rendered`).toContain(t)
  }
})
