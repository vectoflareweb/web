import { BRAND_COMPANY_NAME, BRAND_PARENT_BRAND } from '@/config/branding'

export const LLM_SITE_DESCRIPTION = '{{llm_site_description}}'

export const LLM_FACT_BLOCK = '{{llm_fact_block}}'

export const LLM_FAQ_DESCRIPTION = '{{llm_faq_description}}'

export const LLM_SPANISH_HOMEPAGE_DESCRIPTION = '{{llm_spanish_homepage_description}}'

export const AI_SYSTEM_ROLE = '{{ai_system_role}}'

export const AI_INQUIRY_PROMPT = '{{ai_inquiry_prompt}}'

export const AI_DISCLOSURE = '{{ai_disclosure}}'

export const PARENT_ORG_DESCRIPTION = '{{parent_org_description}}'

export const REGION_COUNT_DEFAULT = 6

export const CUSTOMIZATION_OPTIONS: Record<string, { title: string; body: string }[]> = {
  en: [],
  es: [],
}

export const OEM_APPLICATIONS: Record<string, { title: string; body: string }[]> = {
  en: [],
  es: [],
}

export const HUB_PAGE_ENTRIES: Record<string, { url: string; title: string; excerpt: string }[]> = {
  en: [],
  es: [],
}

export const CASE_STUDY_STATS = {}

export const FAQ_EXCERPTS: Record<string, string> = {
  en: '',
  es: '',
}

export const STATIC_PAGE_CORPUS_TEXT = ''

export const JSONLD_KEYWORDS: Record<string, { keywords: string[]; articleTitle?: string }> = {}
