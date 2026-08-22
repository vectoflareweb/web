/**
 * Content model — data ported from the product marketing site
 * (YAML page sources + MDX article sources in src/content/site/) and parsed
 * at build time via Vite `?raw` glob imports. The product content stays the
 * canonical source: content updates = file copies, no re-transcription.
 *
 * Pages are rendered generically: the pages.yaml registry declares which
 * sections (key + type) a page has, and the section renderer maps each to a
 * widget by key/type/shape.
 */

export interface ContentSectionDef {
  key: string
  type: string
  label?: string
}

export interface ContentPageMeta {
  title?: string
  description?: string
  keywords?: string[]
  /** TechArticle schema fields for long-form research articles. */
  author?: string
  datePublished?: string
  dateModified?: string
}

export interface ContentPage {
  slug: string
  label: string
  path: string
  meta?: ContentPageMeta
  sections: ContentSectionDef[]
  /** Parsed page YAML: section key → section value (shape varies per widget). */
  content: Record<string, any>
}

export interface ContentGalleryImage {
  url: string
  alt?: string
}

export interface ContentSpec {
  label: string
  value: string
}

export interface ContentProductMeta {
  title?: string
  description?: string
}

export interface ContentProduct {
  slug: string
  title: string
  sku?: string
  summary?: string
  description?: string
  image?: string
  gallery?: ContentGalleryImage[]
  category?: string
  tags?: string[]
  specs?: ContentSpec[]
  /** Product-specific FAQ entries (rendered with a shared fallback pool). */
  faqs?: { q: string; a: string }[]
  inStock?: boolean
  featured?: boolean
  metadata?: ContentProductMeta
  /** Markdown body (ported from the source MDX). */
  body: string
}

export interface ContentPost {
  slug: string
  title: string
  date: string
  excerpt?: string
  image?: string
  category?: string
  author?: string
  tags?: string[]
  metadata?: ContentProductMeta
  body: string
}

export interface ContentArticle {
  slug: string
  title: string
  summary?: string
  description?: string
  category?: string
  tags?: string[]
  body: string
  dateModified?: string
}

export interface ContentCaseUse extends ContentArticle {
  environment?: string
  skill?: string
  products?: string[]
}

export interface ContentResearchTopic {
  slug: string
  category: string
  readTime: string
}

export type SearchEntryType = 'solution' | 'guide' | 'project' | 'page'

export interface SearchEntry {
  url: string
  title: string
  excerpt: string
  type: SearchEntryType
  locale: import('@/features/i18n/locale').Locale
  content?: string
}
