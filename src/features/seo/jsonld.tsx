import React from 'react'
import { getNonce } from '@/lib/csp'
import { SITE_NAME, SITE_URL } from '@/config/site'
import { PRODUCT_BUILD_LINE } from '@/product/brand-constants'

export interface FaqQa {
  q: string
  a: string
}

export const SITE_ORIGIN = SITE_URL

function JsonLdInner({ data }: { data: Record<string, unknown> }) {
  const nonce = getNonce()
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
export const JsonLd = React.memo(JsonLdInner)

export function faqLd(faqs: FaqQa[], locale?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale ?? 'en',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function contactPageLd(origin: string, path: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact ' + SITE_NAME,
    url: `${origin}${path}`,
    about: PRODUCT_BUILD_LINE,
  }
}

export function aboutPageLd(origin: string, path: string, description: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About ' + SITE_NAME,
    url: `${origin}${path}`,
    description,
  }
}

export function breadcrumbLd(origin: string, crumbs: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${origin}${c.path}`,
    })),
  }
}

export function siteBreadcrumbLd(crumbs: { name: string; path: string }[]): Record<string, unknown> {
  return breadcrumbLd(SITE_ORIGIN, crumbs)
}

export function itemListLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: `${SITE_ORIGIN}${it.path}`,
    })),
  }
}

export function newsArticleLd(input: {
  origin: string
  title: string
  description: string
  image?: string
  url: string
  datePublished: string
  dateModified?: string
  author?: string
  inLanguage?: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: input.title,
    description: input.description,
    image: input.image,
    url: input.url,
    datePublished: input.datePublished,
    ...(input.dateModified && input.dateModified !== input.datePublished
      ? { dateModified: input.dateModified }
      : {}),
    ...(input.author ? { author: { '@type': 'Person', name: input.author } } : {}),
    publisher: { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: SITE_NAME },
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    inLanguage: input.inLanguage ?? 'en',
  }
}

export function articleLd(input: {
  title: string
  description: string
  path: string
}): Record<string, unknown> {
  const url = `${SITE_ORIGIN}${input.path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url,
    author: { '@id': `${SITE_ORIGIN}/#organization` },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

export {
  siteLd,
  serviceLd,
  projectLd,
  factoryCapabilitiesLd,
  brandHeritageLd,
  enhancedFaqLd,
  warrantyReturnsLd,
  shippingLogisticsLd,
  productVariantFaqLd,
  qcHowToLd,
} from './product-jsonld'
