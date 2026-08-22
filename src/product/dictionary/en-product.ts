export const enProduct = {
  factory: {
    size: 'Factory Size', workers: 'Workers', capacity: 'Annual Capacity',
    lines: 'Production Lines', workshops: 'Workshops', monthly: 'Monthly Capacity',
  },
  moq: {
    existing: 'Existing Model MOQ', pilot: 'Pilot Run MOQ',
    standard: 'Standard MOQ', custom: 'Custom MOQ', note: 'MOQ Notes',
  },
  leadTime: { standard: 'Standard Lead Time', sample: 'Sample Lead Time' },
  certification: { list: 'Certifications' },
  export: { countries: 'Export Countries' },
  quality: { gates: 'Quality Gates', inspectors: 'Inspectors' },
  collab: {
    oem: 'OEM Manufacturing', odm: 'ODM Manufacturing',
    contract: 'Contract Manufacturing', privateLabel: 'Private Label',
    codesign: 'Co-Design',
  },
  sample: { process: 'Sample Process', timeline: 'Sample Timeline' },
  material: { rollNote: 'Material Roll Note' },
  cnc: { accuracy: 'CNC Accuracy' },
  rf: { power: 'RF Power' },
  eva: { hardness: 'EVA Hardness' },
  assembly: { checklist: 'Assembly Checklist' },
  pressure: { test: 'Pressure Test' },
  traceability: { ret: 'Traceability' },
  nda: { window: 'NDA Window' },
  peak: { season: 'Peak Season' },
} as const

export type ProductKey = typeof enProduct
