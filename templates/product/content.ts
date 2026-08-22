import type { Locale } from '@/features/i18n/locale'

export type Localized<T> = Record<Locale, T>

export function pick<T>(obj: Localized<T>, locale: Locale): T {
  return obj[locale]
}

export const strip = (s: string): string => s

/* ─────────────────────────── hero ─────────────────────────── */

export interface HeroContent {
  kicker: string
  titlePre: string
  titleAccent: string
  titlePost: string
  sub: string
  ctaPrimary: string
  ctaSecondary: string
  ctaTertiary: string
  ctaQuartiary: string
  ctaMicro: string
  stats: { value: string; label: string }[]
  mockupLabel: string
  mockupBrand: string
  mockupHint: string
  heroNote: string
  float1: { value: string; label: string }
  float2: { value: string; label: string }
}

export const hero: Localized<HeroContent> = {
  en: {
    kicker: '{{hero_kicker_en}}',
    titlePre: '{{hero_title_pre_en}}',
    titleAccent: '{{hero_title_accent_en}}',
    titlePost: '',
    sub: '{{hero_sub_en}}',
    ctaPrimary: '{{hero_cta_primary_en}}',
    ctaSecondary: '{{hero_cta_secondary_en}}',
    ctaTertiary: '',
    ctaQuartiary: '',
    ctaMicro: '{{hero_cta_micro_en}}',
    stats: [
      { value: '{{stat_1_value}}', label: '{{stat_1_label_en}}' },
      { value: '{{stat_2_value}}', label: '{{stat_2_label_en}}' },
      { value: '{{stat_3_value}}', label: '{{stat_3_label_en}}' },
      { value: '{{stat_4_value}}', label: '{{stat_4_label_en}}' },
    ],
    mockupLabel: '{{mockup_label_en}}',
    mockupBrand: '{{mockup_brand_en}}',
    mockupHint: '{{mockup_hint_en}}',
    heroNote: '{{hero_note_en}}',
    float1: { value: '{{float1_value}}', label: '{{float1_label_en}}' },
    float2: { value: '{{float2_value}}', label: '{{float2_label_en}}' },
  },
  es: {
    kicker: '{{hero_kicker_es}}',
    titlePre: '{{hero_title_pre_es}}',
    titleAccent: '{{hero_title_accent_es}}',
    titlePost: '',
    sub: '{{hero_sub_es}}',
    ctaPrimary: '{{hero_cta_primary_es}}',
    ctaSecondary: '{{hero_cta_secondary_es}}',
    ctaTertiary: '',
    ctaQuartiary: '',
    ctaMicro: '{{hero_cta_micro_es}}',
    stats: [
      { value: '{{stat_1_value}}', label: '{{stat_1_label_es}}' },
      { value: '{{stat_2_value}}', label: '{{stat_2_label_es}}' },
      { value: '{{stat_3_value}}', label: '{{stat_3_label_es}}' },
      { value: '{{stat_4_value}}', label: '{{stat_4_label_es}}' },
    ],
    mockupLabel: '{{mockup_label_es}}',
    mockupBrand: '{{mockup_brand_es}}',
    mockupHint: '{{mockup_hint_es}}',
    heroNote: '{{hero_note_es}}',
    float1: { value: '{{float1_value}}', label: '{{float1_label_es}}' },
    float2: { value: '{{float2_value}}', label: '{{float2_label_es}}' },
  },
}

/* ─────────────────────────── why ─────────────────────────── */

export interface WhyBullet { icon: string; title: string; body: string }
export interface WhyContent { kicker: string; title: string; sub: string; bullets: WhyBullet[] }
export const why: Localized<WhyContent> = {
  en: { kicker: '', title: '', sub: '', bullets: [] },
  es: { kicker: '', title: '', sub: '', bullets: [] },
}

/* ─────────────────────────── trust bar ─────────────────────────── */

export interface TrustStat { value: string; label: string }
export interface TrustBarContent { kicker: string; title: string; stats: TrustStat[] }
export const trustBar: Localized<TrustBarContent> = {
  en: { kicker: '', title: '', stats: [] },
  es: { kicker: '', title: '', stats: [] },
}

/* ─────────────────────────── solve ─────────────────────────── */

export interface ScopeCard { icon: string; title: string; body: string }
export interface SolveContent { kicker: string; title: string; sub: string; cards: ScopeCard[] }
export const solve: Localized<SolveContent> = {
  en: { kicker: '', title: '', sub: '', cards: [] },
  es: { kicker: '', title: '', sub: '', cards: [] },
}

/* ─────────────────────────── capability ─────────────────────────── */

export interface CapabilityBlock { icon: string; title: string; body: string }
export interface CapabilityContent { kicker: string; title: string; sub: string; blocks: CapabilityBlock[] }
export const capability: Localized<CapabilityContent> = {
  en: { kicker: '', title: '', sub: '', blocks: [] },
  es: { kicker: '', title: '', sub: '', blocks: [] },
}

/* ─────────────────────────── quality ─────────────────────────── */

export interface QualityStep { title: string; body: string }
export interface QualityContent { kicker: string; title: string; sub: string; steps: QualityStep[] }
export const quality: Localized<QualityContent> = {
  en: { kicker: '', title: '', sub: '', steps: [] },
  es: { kicker: '', title: '', sub: '', steps: [] },
}

/* ─────────────────────────── commercial / MOQ ─────────────────────────── */

export interface CommercialCell { label: string; value: string; note?: string }
export interface MoqTier { label: string; range: string; note: string }
export interface CommercialContent { kicker: string; title: string; sub: string; tiers: MoqTier[]; cells: CommercialCell[] }
export const commercial: Localized<CommercialContent> = {
  en: { kicker: '', title: '', sub: '', tiers: [], cells: [] },
  es: { kicker: '', title: '', sub: '', tiers: [], cells: [] },
}

/* ─────────────────────────── serve ─────────────────────────── */

export interface Segment { icon: string; label: string; href: string }
export interface ServeContent { kicker: string; title: string; sub: string; segments: Segment[] }
export const serve: Localized<ServeContent> = {
  en: { kicker: '', title: '', sub: '', segments: [] },
  es: { kicker: '', title: '', sub: '', segments: [] },
}

/* ─────────────────────────── solutions ─────────────────────────── */

export interface SolutionPillar { icon: string; title: string; body: string }
export interface SolutionsContent { kicker: string; title: string; sub: string; pillars: SolutionPillar[] }
export const solutions: Localized<SolutionsContent> = {
  en: { kicker: '', title: '', sub: '', pillars: [] },
  es: { kicker: '', title: '', sub: '', pillars: [] },
}

/* ─────────────────────────── studio ─────────────────────────── */

export interface StudioStep { title: string; body: string }
export interface StudioContent { kicker: string; title: string; sub: string; steps: StudioStep[] }
export const studio: Localized<StudioContent> = {
  en: { kicker: '', title: '', sub: '', steps: [] },
  es: { kicker: '', title: '', sub: '', steps: [] },
}

/* ─────────────────────────── products ─────────────────────────── */

export interface Product {
  name: string
  sku: string
  desc: string
  specs: string
  artwork: string
  for: string[]
  image: string
  href: string
}
export interface ProductFilterGroup { key: string; label: string; options: string[] }
export interface ProductsContent { kicker: string; title: string; sub: string; items: Product[]; filters: ProductFilterGroup[] }
export const productFilters: ProductFilterGroup[] = []
export const products: Localized<ProductsContent> = {
  en: { kicker: '', title: '', sub: '', items: [], filters: [] },
  es: { kicker: '', title: '', sub: '', items: [], filters: [] },
}

/* ─────────────────────────── video showcase ─────────────────────────── */

export interface VideoStep { title: string; url: string }
export interface VideoShowcaseContent { kicker: string; title: string; sub: string; videos: VideoStep[] }
export const videoShowcase: Localized<VideoShowcaseContent> = {
  en: { kicker: '', title: '', sub: '', videos: [] },
  es: { kicker: '', title: '', sub: '', videos: [] },
}

/* ─────────────────────────── works ─────────────────────────── */

export interface Step { title: string; body: string }
export interface WorksContent { kicker: string; title: string; sub: string; steps: Step[] }
export const works: Localized<WorksContent> = {
  en: { kicker: '', title: '', sub: '', steps: [] },
  es: { kicker: '', title: '', sub: '', steps: [] },
}

/* ─────────────────────────── platforms ─────────────────────────── */

export interface PlatformItem { name: string; slug: string; description: string }
export interface PlatformsContent { kicker: string; title: string; sub: string; platforms: PlatformItem[] }
export const platforms: Localized<PlatformsContent> = {
  en: { kicker: '', title: '', sub: '', platforms: [] },
  es: { kicker: '', title: '', sub: '', platforms: [] },
}

/* ─────────────────────────── gallery ─────────────────────────── */

export interface Project { title: string; image: string; href: string }
export interface GalleryContent { kicker: string; title: string; sub: string; projects: Project[] }
export const gallery: Localized<GalleryContent> = {
  en: { kicker: '', title: '', sub: '', projects: [] },
  es: { kicker: '', title: '', sub: '', projects: [] },
}

/* ─────────────────────────── guides ─────────────────────────── */

export interface GuideLink { title: string; href: string }
export interface GuidesContent { kicker: string; title: string; sub: string; guides: GuideLink[] }
export const guides: Localized<GuidesContent> = {
  en: { kicker: '', title: '', sub: '', guides: [] },
  es: { kicker: '', title: '', sub: '', guides: [] },
}

export const manufacturingGuides: Localized<GuidesContent> = {
  en: { kicker: '', title: '', sub: '', guides: [] },
  es: { kicker: '', title: '', sub: '', guides: [] },
}

/* ─────────────────────────── faq ─────────────────────────── */

export interface FaqItem { q: string; a: string }
export interface FaqContent { kicker: string; title: string; sub: string; items: FaqItem[] }
export const faq: Localized<FaqContent> = {
  en: { kicker: '', title: '', sub: '', items: [] },
  es: { kicker: '', title: '', sub: '', items: [] },
}

export const homeFaq: Localized<FaqContent> = {
  en: { kicker: '', title: '', sub: '', items: [] },
  es: { kicker: '', title: '', sub: '', items: [] },
}

/* ─────────────────────────── cta ─────────────────────────── */

export interface CtaContent { title: string; body: string; button: string; note: string }
export const cta: Localized<CtaContent> = {
  en: { title: '', body: '', button: '', note: '' },
  es: { title: '', body: '', button: '', note: '' },
}

/* ─────────────────────────── value proposition ─────────────────────────── */

export interface ValuePropCard { title: string; body: string }
export interface ValuePropContent { kicker: string; title: string; sub: string; cards: ValuePropCard[] }
export const valueProp: Localized<ValuePropContent> = {
  en: { kicker: '', title: '', sub: '', cards: [] },
  es: { kicker: '', title: '', sub: '', cards: [] },
}

/* ─────────────────────────── boundary ─────────────────────────── */

export interface BoundaryRow { ours: string; theirs: string }
export interface BoundaryContent { kicker: string; title: string; sub: string; oursTitle: string; theirsTitle: string; rows: BoundaryRow[]; footer: string }
export const boundary: Localized<BoundaryContent> = {
  en: { kicker: '', title: '', sub: '', oursTitle: '', theirsTitle: '', rows: [], footer: '' },
  es: { kicker: '', title: '', sub: '', oursTitle: '', theirsTitle: '', rows: [], footer: '' },
}

/* ─────────────────────────── about ─────────────────────────── */

export interface AboutContent {
  kicker: string
  title: string
  sub: string
  story: string[]
  values: { title: string; body: string }[]
  capabilities: string[]
  stats: { value: string; label: string }[]
  strength: { title: string; body: string }[]
  partnering: { title: string; body: string[] }
}
export const about: Localized<AboutContent> = {
  en: { kicker: '', title: '', sub: '', story: [], values: [], capabilities: [], stats: [], strength: [], partnering: { title: '', body: [] } },
  es: { kicker: '', title: '', sub: '', story: [], values: [], capabilities: [], stats: [], strength: [], partnering: { title: '', body: [] } },
}

/* ─────────────────────────── customizer ─────────────────────────── */

export interface CustomizerContent {
  kicker: string
  title: string
  sub: string
  status: string
  statusBody: string
  steps: { title: string; body: string }[]
  mockupLabel: string
  mockupBrand: string
  stepLabel: string
  boardLabel: string
  cta: string
}
export const customizer: Localized<CustomizerContent> = {
  en: { kicker: '', title: '', sub: '', status: '', statusBody: '', steps: [], mockupLabel: '', mockupBrand: '', stepLabel: '', boardLabel: '', cta: '' },
  es: { kicker: '', title: '', sub: '', status: '', statusBody: '', steps: [], mockupLabel: '', mockupBrand: '', stepLabel: '', boardLabel: '', cta: '' },
}

/* ─────────────────────────── products page ─────────────────────────── */

export interface ProductsPageContent { kicker: string; title: string; sub: string; customTitle: string; customBody: string; customPoints: string[] }
export const productsPage: Localized<ProductsPageContent> = {
  en: { kicker: '', title: '', sub: '', customTitle: '', customBody: '', customPoints: [] },
  es: { kicker: '', title: '', sub: '', customTitle: '', customBody: '', customPoints: [] },
}

/* ─────────────────────────── catalog ─────────────────────────── */

export interface CatalogContent { kicker: string; title: string; body: string; emailLabel: string; emailPlaceholder: string; submit: string; secure: string; successTitle: string; successBody: string }
export const catalogDownload: Localized<CatalogContent> = {
  en: { kicker: '', title: '', body: '', emailLabel: '', emailPlaceholder: '', submit: '', secure: '', successTitle: '', successBody: '' },
  es: { kicker: '', title: '', body: '', emailLabel: '', emailPlaceholder: '', submit: '', secure: '', successTitle: '', successBody: '' },
}

/* ─────────────────────────── gallery page ─────────────────────────── */

export interface GalleryPageContent { kicker: string; title: string; sub: string; note: string }
export const galleryPage: Localized<GalleryPageContent> = {
  en: { kicker: '', title: '', sub: '', note: '' },
  es: { kicker: '', title: '', sub: '', note: '' },
}

/* ─────────────────────────── serve page ─────────────────────────── */

export interface ServePageContent { kicker: string; title: string; sub: string }
export const servePage: Localized<ServePageContent> = {
  en: { kicker: '', title: '', sub: '' },
  es: { kicker: '', title: '', sub: '' },
}

/* ─────────────────────────── works page ─────────────────────────── */

export interface WorksPageContent { kicker: string; title: string; sub: string; consultTitle: string; consultBody: string }
export const worksPage: Localized<WorksPageContent> = {
  en: { kicker: '', title: '', sub: '', consultTitle: '', consultBody: '' },
  es: { kicker: '', title: '', sub: '', consultTitle: '', consultBody: '' },
}

/* ─────────────────────────── signature series ─────────────────────────── */

export interface SeriesItem { title: string; sku: string; body: string; image: string; href: string }
export interface SeriesContent { kicker: string; title: string; sub: string; items: SeriesItem[] }
export const series: Localized<SeriesContent> = {
  en: { kicker: '', title: '', sub: '', items: [] },
  es: { kicker: '', title: '', sub: '', items: [] },
}

/* ─────────────────────────── board categories ─────────────────────────── */

export interface BoardCategory {
  id: string
  label: string
  desc: string
  image: string
  href: string
}

export interface BoardCategoriesContent {
  kicker: string
  title: string
  sub: string
  viewLabel: string
  items: BoardCategory[]
}

export const boardCategories: Localized<BoardCategoriesContent> = {
  en: { kicker: '', title: '', sub: '', viewLabel: '', items: [] },
  es: { kicker: '', title: '', sub: '', viewLabel: '', items: [] },
}
