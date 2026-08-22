import { test, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import * as React from 'react'
import { projects } from '@/product/projects'

// ProjectPage itself uses no router hooks — only MarketingShell reads the root
// loader data (theme/user). Mock getRouteApi so the case page can be SSR'd in
// a plain node test without importing routeTree.gen.ts (Workers-only modules).
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    getRouteApi: () => ({ useLoaderData: () => ({ theme: 'light' as const, user: null }) }),
    useRouter: () => ({ navigate: () => undefined, buildLocation: () => ({ href: '/', pathname: '/' }) }),
  }
})

import { ProjectPage } from '@/components/marketing/project-page'
import { I18nProvider } from '@/features/i18n/provider'

const html = (slug: string, locale: 'en' | 'es' = 'en'): string => {
  const page = projects[locale].find((p) => p.slug === slug)
  expect(page, `${slug} (${locale}) not found`).toBeTruthy()
  return renderToString(
    React.createElement(I18nProvider, { locale, children: React.createElement(ProjectPage, { page: page! }) }),
  )
}

test('en/es project sets stay structurally symmetric and complete', () => {
  expect(projects.es.map((p) => p.slug)).toEqual(projects.en.map((p) => p.slug))
  for (const locale of ['en', 'es'] as const) {
    for (const p of projects[locale]) {
      expect(p.customizations.length, `${p.slug} (${locale}) customizations`).toBeGreaterThanOrEqual(5)
      expect(p.inspectionFocus.length, `${p.slug} (${locale}) inspectionFocus`).toBeGreaterThanOrEqual(4)
      if (p.metrics) {
        expect(p.metrics.length, `${p.slug} (${locale}) metrics`).toBe(4)
        const n = p.takeaways?.length ?? 0
        expect(n, `${p.slug} (${locale}) takeaways`).toBeGreaterThanOrEqual(3)
        expect(n % 2, `${p.slug} (${locale}) takeaways must pair in the 2-col grid`).toBe(0)
      }
    }
  }
})

test('every project page renders without error (en + es)', () => {
  for (const locale of ['en', 'es'] as const) {
    for (const p of projects[locale]) {
      expect(() => html(p.slug, locale), `${p.slug} (${locale}) throws during render`).not.toThrow()
    }
  }
})

test('flagship case renders metrics strip, takeaways, scenario CTA and related cases', () => {
  const out = html('coastal-rental-fleet')
  for (const s of ['320', '120', '−20–25%', 'Key Takeaways', 'What This Project Shows', 'Your Project Could Follow the Same Path', 'Similar Projects We Delivered', 'Facing a similar challenge?']) {
    expect(out, `coastal-rental-fleet missing "${s}"`).toContain(s)
  }
  expect(out).toContain('Standardizing a 200-Board Rental Fleet') // related case card
})

test('es flagship case renders metrics and takeaways in Spanish', () => {
  const out = html('eu-distributor-private-label', 'es')
  for (const s of ['1.200', '90', 'Conclusiones clave', 'Lo que muestra este proyecto', 'Tu proyecto puede seguir el mismo camino', 'Proyectos similares que hemos entregado', '¿Te enfrentas a un reto similar?']) {
    expect(out, `eu-distributor-private-label (es) missing "${s}"`).toContain(s)
  }
})

test('legacy case without metrics renders no takeaways block', () => {
  const out = html('fishing-sup-program')
  expect(out).not.toContain('Key Takeaways')
  expect(out).not.toContain('midCtaText') // untranslated key must never leak
})