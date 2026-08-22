import { BRAND_SOCIAL, BRAND_CONTACT, BRAND_BOILERPLATE, BRAND_BUILD_LINE, BRAND_NOT_ROB } from '@/config/branding'

export const FACTS_VERIFIED = '''' as const

export type VerifiedSource = 'factory-record' | 'qc-procedure' | 'certificate' | 'project-record' | 'audit-report'

export const FACTS = {
  warehouseM2: '',
  workers: '',
  annualCapacity: '',
  moq: {
    existingPlatform: '',
    pilotBatch: '',
    standardRun: '',
    customMould: '',
    multiSku: 'Each SKU (size/color combo) on a separate material roll has its own MOQ',
  },
  moqNote: 'MOQ is confirmed after specification review.',
  moqNoteEs: 'El MOQ se confirma tras la revisión de especificaciones.',
  moqExplanation: {
    sample: '''',
    coBrand: '''',
    pilot: '''',
    standard: '''',
    customMould: '''',
  },
  materialRollNote: '''',
  moqDecisionTree: [
    { scenario: 'Existing platform, logo overlay only', min: '', unit: 'per design', condition: 'Same shape, same material roll, same colorway' },
    { scenario: 'Custom graphics / packaging on existing platform', min: '', unit: 'pilot batch', condition: 'Same shape; new artwork requires visual proof approval' },
    { scenario: 'Full custom — new shape / construction', min: '', unit: 'per approved configuration', condition: 'New mould or tooling may apply' },
  ],
  leadTime: '',
  sampleTime: '',
  certifications: [''],
  exportCountries: '',
  workshops: 0,
  productionLines: 0,
  monthlyCapacity: '',
  ndaWindow: '',
  qualityGates: 0,
  inspectors: [''],
  cncAccuracy: '''',
  rfPower: '''',
  evaHardness: '''',
  assemblyChecklist: [],
  pressureTest: '''',
  pressureReject: '''',
  traceabilityRet: '''',
  certificationNote: '''',
  peakSeason: '''',
  social: BRAND_SOCIAL,
  contact: BRAND_CONTACT,
  boilerplate: BRAND_BOILERPLATE,
  buildLine: BRAND_BUILD_LINE,
  notRob: BRAND_NOT_ROB,
  tagline: 'Your brand tagline — one compelling sentence.',
  taglineEs: '',
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
