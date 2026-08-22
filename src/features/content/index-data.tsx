import { createContext, useContext, type ReactNode } from 'react'
import { setBrandCount } from './brand'

/**
 * Per-page widget index payloads for the vectoflare content site, resolved
 * server-side.
 *
 * Widgets previously pulled their lists straight from the loader, which forced
 * the whole 900 KB+ vectoflare corpus and the YAML parser into the client bundle.
 * The catch-all loader now ships only the lists the current page renders;
 * they are hydrated through this provider and read via useAferIndex().
 */
export interface AferIndexNews {
  slug: string
  title: string
  date: string
  excerpt?: string
  image?: string
  category?: string
}

export interface AferIndexProduct {
  slug: string
  title: string
  image?: string
  sku?: string
  summary?: string
}

export interface AferIndexTopic {
  slug: string
  category: string
  readTime: string
}

export interface AferIndexCase {
  slug: string
  title: string
  summary?: string
  category?: string
}

export interface AferIndexData {
  regionCount: number
  news?: AferIndexNews[]
  products?: AferIndexProduct[]
  topics?: AferIndexTopic[]
  cases?: AferIndexCase[]
}

const AferIndexContext = createContext<AferIndexData>({ regionCount: 6 })

export function AferIndexProvider({ value, children }: { value: AferIndexData; children: ReactNode }) {
  setBrandCount(value.regionCount)
  return <AferIndexContext.Provider value={value}>{children}</AferIndexContext.Provider>
}

export function useAferIndex(): AferIndexData {
  return useContext(AferIndexContext)
}
