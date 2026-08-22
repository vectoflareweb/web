export interface GuideSection {
  title: string
  body: string
}

export interface Guide {
  slug: string
  title: string
  intro: string[]
  sections: GuideSection[]
  faqs: { q: string; a: string }[]
  related?: { label: string; href: string }[]
}

export interface GuideCard {
  slug: string
  title: string
  tag: string
}

export const GUIDES: Guide[] = []
export const GUIDES_ES: Guide[] = []
export const GUIDE_CARDS: GuideCard[] = []

export function localizedGuides(locale: string): Guide[] {
  return locale === 'es' ? GUIDES_ES : GUIDES
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug)
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug)
}

export function guideCard(slug: string): GuideCard | undefined {
  return GUIDE_CARDS.find(c => c.slug === slug)
}
