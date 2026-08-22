import { BRAND_SOCIAL, BRAND_CONTACT, BRAND_BOILERPLATE, BRAND_BUILD_LINE, BRAND_NOT_ROB } from '@/config/branding'

export const FACTS_VERIFIED = '{{facts_verified_date}}' as const

export type VerifiedSource = 'factory-record' | 'qc-procedure' | 'certificate' | 'project-record' | 'audit-report'

export const FACTS = {
  warehouseM2: '{{factory_size}}',
  workers: '{{workers_count}}',
  annualCapacity: '{{annual_capacity}}',
  moq: {
    existingPlatform: '{{moq_existing}}',
    pilotBatch: '{{moq_pilot}}',
    standardRun: '{{moq_standard}}',
    customMould: '{{moq_custom}}',
    multiSku: 'Each SKU (size/color combo) on a separate material roll has its own MOQ',
  },
  moqNote: '{{moq_note}}',
  moqNoteEs: '{{moq_note_es}}',
  moqExplanation: {
    sample: '{{sample_units}}',
    coBrand: '{{co_brand_units}}',
    pilot: '{{pilot_units}}',
    standard: '{{standard_units}}',
    customMould: '{{custom_mould_units}}',
  },
  materialRollNote: '{{material_roll_note}}',
  moqDecisionTree: [
    { scenario: 'Existing platform, logo overlay only', min: '{{moq_existing}}', unit: 'per design', condition: 'Same shape, same material roll, same colorway' },
    { scenario: 'Custom graphics / packaging on existing platform', min: '{{moq_pilot}}', unit: 'pilot batch', condition: 'Same shape; new artwork requires visual proof approval' },
    { scenario: 'Full custom — new shape / construction', min: '{{moq_standard}}', unit: 'per approved configuration', condition: 'New mould or tooling may apply' },
  ],
  leadTime: '{{lead_time}}',
  sampleTime: '{{sample_time}}',
  certifications: [{{certifications}}],
  exportCountries: '{{export_countries}}',
  workshops: 0,
  productionLines: 0,
  monthlyCapacity: '{{monthly_capacity}}',
  ndaWindow: '{{nda_window}}',
  qualityGates: 0,
  inspectors: [{{inspectors}}],
  cncAccuracy: '{{cnc_accuracy}}',
  rfPower: '{{rf_power}}',
  evaHardness: '{{eva_hardness}}',
  assemblyChecklist: [],
  pressureTest: '{{pressure_test}}',
  pressureReject: '{{pressure_reject}}',
  traceabilityRet: '{{traceability_ret}}',
  certificationNote: '{{certification_note}}',
  peakSeason: '{{peak_season}}',
  social: BRAND_SOCIAL,
  contact: BRAND_CONTACT,
  boilerplate: BRAND_BOILERPLATE,
  buildLine: BRAND_BUILD_LINE,
  notRob: BRAND_NOT_ROB,
  tagline: '{{tagline}}',
  taglineEs: '{{tagline_es}}',
} as const

export type FactLiteral = typeof FACTS

export const CERTIFICATION_NAMES: Record<string, string> = {}

export const MOQ_SHORT = {
  existing: FACTS.moq.existingPlatform,
  pilot: FACTS.moq.pilotBatch,
  standard: FACTS.moq.standardRun,
  custom: FACTS.moq.customMould,
} as const

export const COLLABORATION_MODES = [
  'OEM',
  'ODM',
  'Contract Manufacturing',
  'Private Label',
  'Co-Design',
] as const
