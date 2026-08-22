export { FACTS, type FactLiteral } from './facts'

export {
  type Localized,
  pick,
  type HeroContent,
  hero,
  type WhyBullet,
  type WhyContent,
  why,
  strip,
  type TrustStat,
  type TrustBarContent,
  trustBar,
  type ScopeCard,
  type SolveContent,
  solve,
  type CapabilityBlock,
  type CapabilityContent,
  capability,
  type QualityStep,
  type QualityContent,
  quality,
  type CommercialCell,
  type MoqTier,
  type CommercialContent,
  commercial,
  type Segment,
  type ServeContent,
  serve,
  type SolutionPillar,
  type SolutionsContent,
  solutions,
  type StudioStep,
  type StudioContent,
  studio,
  type Product,
  type ProductsContent,
  type ProductFilterGroup,
  productFilters,
  products,
  type VideoStep,
  type VideoShowcaseContent,
  videoShowcase,
  type Step,
  type WorksContent,
  works,
  type PlatformItem,
  type PlatformsContent,
  platforms,
  type Project,
  type GalleryContent,
  gallery,
  type GuideLink,
  type GuidesContent,
  guides,
  manufacturingGuides,
  type FaqItem,
  type FaqContent,
  faq,
  homeFaq,
  type CtaContent,
  cta,
  type ValuePropCard,
  type ValuePropContent,
  valueProp,
  type BoundaryRow,
  type BoundaryContent,
  boundary,
  type AboutContent,
  about,
  type CustomizerContent,
  customizer,
  type ProductsPageContent,
  productsPage,
  type CatalogContent,
  catalogDownload,
  type GalleryPageContent,
  galleryPage,
  type ServePageContent,
  servePage,
  type WorksPageContent,
  worksPage,
  type SeriesItem,
  type SeriesContent,
  series,
  type BoardCategory,
  type BoardCategoriesContent,
  boardCategories,
} from './content'

export {
  type ProjectData,
  projects,
  getProject,
  type ProjectsMeta,
  projectsMeta,
} from './projects'

export {
  type SeriesPageData,
  seriesPages,
  getSeriesPage,
} from './series-pages'

export {
  type KnowledgeArticle,
  type KnowledgeMeta,
  knowledge,
  knowledgeMeta,
  getArticle,
} from './knowledge'

export {
  type CtaLevel,
  type SolutionPageData,
  SOLUTION_PATHS,
  solutionPath,
  solutionPages,
  getSolutionPage,
} from './solution-pages'

export {
  type ProcurementRow,
  type ProcurementProfile,
  procurementProfiles,
  commercialRows,
} from './procurement'

export { LLMS_TXT } from './llms-content'

export {
  SITE_FACTS,
  HERO_CONTENT,
  siteConfig,
  type Locale,
} from './site-config'

export {
  type GuideSection,
  type Guide,
  GUIDES,
  GUIDES_ES,
  localizedGuides,
  getGuide,
  getGuideBySlug,
  type GuideCard,
  GUIDE_CARDS,
  guideCard,
} from './guide-content'

export { buildHubEntries } from './hub-pages'

export {
  LLM_SITE_DESCRIPTION,
  LLM_FACT_BLOCK,
  LLM_FAQ_DESCRIPTION,
  LLM_SPANISH_HOMEPAGE_DESCRIPTION,
  AI_SYSTEM_ROLE,
  AI_INQUIRY_PROMPT,
  AI_DISCLOSURE,
  PARENT_ORG_DESCRIPTION,
  REGION_COUNT_DEFAULT,
  CUSTOMIZATION_OPTIONS,
  OEM_APPLICATIONS,
  HUB_PAGE_ENTRIES,
  CASE_STUDY_STATS,
  FAQ_EXCERPTS,
  STATIC_PAGE_CORPUS_TEXT,
  JSONLD_KEYWORDS,
} from './ai-content'

export {
  PRODUCT_TAGLINE,
  PRODUCT_DESCRIPTION,
  PRODUCT_BOILERPLATE,
  PRODUCT_BUILD_LINE,
  PRODUCT_NOT_ROB,
  PRODUCT_OG_IMAGE_FILENAME,
} from './brand-constants'

export { PRODUCT_JSONLD } from './product-jsonld'
export { ENTITY_DATA, ENTITY_FACTS, ENTITY_SAME_AS, ENTITY_SERVICES, ENTITY_KNOWS_ABOUT, ENTITY_SUBJECT_OF, PAGE_TITLES } from './entity-data'
export { GLOSSARY } from './glossary'
export { EDGE_REDIRECTS } from './edge-redirects'
export { SHADOWED_PATHS, EXTRA_PATHS } from './route-registry'
export { ASSET_CDN_PREFIX } from './asset-map'
