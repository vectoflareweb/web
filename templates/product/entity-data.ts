export const ENTITY_DATA = {
  name: '{{site_name}}',
  description: '{{description}}',
  domain: '{{site_domain}}',
} as const

export const ENTITY_FACTS: Record<string, unknown> = {}

export const ENTITY_SAME_AS: string[] = []

export const ENTITY_SERVICES: Array<{ type: string; name: string; description: string }> = []

export const ENTITY_KNOWS_ABOUT: string[] = []

export const ENTITY_SUBJECT_OF: Array<{ type: string; name: string; path: string }> = []

export const PAGE_TITLES: Record<string, string> = {}
