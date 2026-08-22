import { createServerFn } from '@tanstack/react-start'
import type { Locale } from '@/features/i18n/locale'
import type { SearchEntry, SearchEntryType } from '@/features/content/types'

export type { SearchEntry, SearchEntryType }

/** Server-resolved search index for one locale, consumed by the `/search` page loader. */
export const searchIndexServer = createServerFn({ method: 'GET' })
  .validator((input: { locale: Locale }) => input)
  .handler(async ({ data }) => {
    const { buildExtendedIndex } = await import('./search-index.server')
    return buildExtendedIndex(data.locale)
  })
