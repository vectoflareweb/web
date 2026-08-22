import type { Localized } from './content'

export interface ProcurementRow {
  label: string
  value: string
}

export interface ProcurementProfile {
  bestFor: string
  sizes: string
  construction: string
  customization: string
  moq: string
  leadTime: string
  specRows: ProcurementRow[]
  keyQuestions: string[]
}

export const procurementProfiles: Localized<Record<string, ProcurementProfile>> = {
  en: {},
  es: {},
}

export const commercialRows: ProcurementRow[] = []
