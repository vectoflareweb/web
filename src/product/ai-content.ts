import { BRAND_COMPANY_NAME, BRAND_PARENT_BRAND } from '@/config/branding'

export const LLM_SITE_DESCRIPTION = 'Description of the site for LLMs (used in /llms.txt).'

export const LLM_FACT_BLOCK = ''''

export const LLM_FAQ_DESCRIPTION = 'Description of the FAQ section for LLMs.'

export const LLM_SPANISH_HOMEPAGE_DESCRIPTION = ''''

export const AI_SYSTEM_ROLE = 'You are a helpful sales assistant for {site_name}. Answer questions about products, MOQ, lead times, and manufacturing capabilities.'

export const AI_INQUIRY_PROMPT = ''''

export const AI_DISCLOSURE = ''''

export const PARENT_ORG_DESCRIPTION = ''''

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
