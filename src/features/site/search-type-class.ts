import type { SearchEntry } from '@/features/site/search'

export const TYPE_CLASS: Record<SearchEntry['type'], string> = {
  solution: 'bg-primary/10 text-primary',
  guide: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  project: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  page: 'bg-bg-alt text-fg-2',
}
