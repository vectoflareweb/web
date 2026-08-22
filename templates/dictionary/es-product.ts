export const esProduct = {
  factory: {
    size: 'Tamaño de Fábrica', workers: 'Trabajadores', capacity: 'Capacidad Anual',
    lines: 'Líneas de Producción', workshops: 'Talleres', monthly: 'Capacidad Mensual',
  },
  moq: {
    existing: 'MOQ Modelo Existente', pilot: 'MOQ Tirada Piloto',
    standard: 'MOQ Estándar', custom: 'MOQ Personalizado', note: 'Notas MOQ',
  },
  leadTime: { standard: 'Plazo Estándar', sample: 'Plazo de Muestra' },
  certification: { list: 'Certificaciones' },
  export: { countries: 'Países de Exportación' },
  quality: { gates: 'Puntos de Calidad', inspectors: 'Inspectores' },
  collab: {
    oem: 'Fabricación OEM', odm: 'Fabricación ODM',
    contract: 'Fabricación por Contrato', privateLabel: 'Marca Privada',
    codesign: 'Co-Diseño',
  },
  sample: { process: 'Proceso de Muestra', timeline: 'Plazo de Muestra' },
  material: { rollNote: 'Nota de Material' },
  cnc: { accuracy: 'Precisión CNC' },
  rf: { power: 'Potencia RF' },
  eva: { hardness: 'Dureza EVA' },
  assembly: { checklist: 'Lista de Ensamblaje' },
  pressure: { test: 'Prueba de Presión' },
  traceability: { ret: 'Trazabilidad' },
  nda: { window: 'Ventana NDA' },
  peak: { season: 'Temporada Alta' },
} as const

export type ProductKeyEs = typeof esProduct
