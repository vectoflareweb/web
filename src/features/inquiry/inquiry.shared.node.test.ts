/**
 * Pure-logic tests for the inquiry RFQ pipeline: input hardening (clamp),
 * hard gating (isValid) and B2B lead scoring (scoreInquiry → tier).
 */
import { describe, expect, test } from 'vitest'
import {
  checkProjectFile,
  clampInquiryInput,
  fileExtension,
  inquiryScoreSignals,
  isValidInquiry,
  scoreInquiry,
  sniffProjectFile,
  type InquiryInput,
} from './inquiry.shared'

function validInput(overrides: Partial<InquiryInput> = {}): InquiryInput {
  return {
    company: 'Acme Boards GmbH',
    website: 'acme-boards.com',
    country: 'Germany',
    email: 'purchasing@acme-boards.com',
    whatsapp: '+49 170 0000000',
    businessType: 'brand',
    quantity: 'q100-299',
    category: 'all-around',
    timeline: 't3-6mo',
    targetMarket: 'EU retailers',
    projectStage: 'reviewing',
    role: 'purchasing',
    boardPlatform: '11′ × 32″',
    construction: 'premium',
    customization: 'logo,graphics',
    packaging: 'branded',
    compliance: 'eu',
    docs: 'test-report',
    annualVolume: 'v300-999',
    budget: '€349–€449 retail',
    nda: 'no',
    consent: 'yes',
    requirements: 'Need UV-resistant boards with custom graphics for our summer fleet.',
    ...overrides,
  }
}

describe('clampInquiryInput', () => {
  test('normalizes email, website and whitespace', () => {
    const out = clampInquiryInput({ ...validInput(), website: 'HTTPS://Acme-Boards.com/', email: '  Buyer@Acme-Boards.COM ' })
    expect(out.website).toBe('Acme-Boards.com/')
    expect(out.email).toBe('buyer@acme-boards.com')
    expect(out.company).toBe('Acme Boards GmbH')
  })

  test('rejects unknown enum values → empty string (hard fail in isValid)', () => {
    const out = clampInquiryInput({
      ...validInput(),
      businessType: 'hacker',
      quantity: 'q999999',
      category: 'mystery-board',
      timeline: 'yesterday',
      projectStage: 'nowhere',
      role: 'ceo-troll',
      construction: 'beyond-premium',
      packaging: 'void',
      compliance: 'mars',
      annualVolume: 'v99999',
      nda: 'maybe',
      consent: 'sure',
    })
    expect(out.businessType).toBe('')
    expect(out.quantity).toBe('')
    expect(out.category).toBe('')
    expect(out.timeline).toBe('')
    expect(out.projectStage).toBe('')
    expect(out.role).toBe('')
    expect(out.construction).toBe('')
    expect(out.packaging).toBe('')
    expect(out.compliance).toBe('')
    expect(out.annualVolume).toBe('')
    expect(out.nda).toBe('')
    expect(out.consent).toBe('')
  })

  test('keeps known enum values', () => {
    const out = clampInquiryInput(validInput())
    expect(out.businessType).toBe('brand')
    expect(out.quantity).toBe('q100-299')
    expect(out.category).toBe('all-around')
    expect(out.timeline).toBe('t3-6mo')
    expect(out.projectStage).toBe('reviewing')
    expect(out.role).toBe('purchasing')
    expect(out.consent).toBe('yes')
  })

  test('pickList keeps only whitelisted comma values, preserves order', () => {
    const out = clampInquiryInput({ ...validInput(), customization: 'logo,naughty,tooling,,graphics' })
    expect(out.customization).toBe('logo,tooling,graphics')
  })

  test('single unsupported pickList value falls through to the list parser', () => {
    expect(clampInquiryInput({ ...validInput(), docs: 'audit,inspection' }).docs).toBe('audit,inspection')
    expect(clampInquiryInput({ ...validInput(), docs: 'bogus,audit' }).docs).toBe('audit')
  })

  test('caps string lengths and hard-fails non-strings', () => {
    const out = clampInquiryInput({
      ...validInput(),
      company: 'X'.repeat(500),
      requirements: 'R'.repeat(5000),
      whatsapp: 42 as unknown as string,
    })
    expect(out.company).toHaveLength(120)
    expect(out.requirements).toHaveLength(2000)
    expect(out.whatsapp).toBe('')
  })

  test('null/undefined input → all defaults, no throw', () => {
    const out = clampInquiryInput(null)
    expect(out.company).toBe('')
    expect(out.consent).toBe('')
    expect(out.requirements).toBe('')
  })
})

describe('isValidInquiry', () => {
  test('complete input passes', () => {
    expect(isValidInquiry(validInput())).toBe(true)
  })

  test.each([
    ['company', { company: 'X' }],
    ['company missing entirely', { company: '' }],
    ['email', { email: 'not-an-email' }],
    ['country+market both empty', { country: '', targetMarket: '' }],
    ['businessType', { businessType: '' }],
    ['quantity', { quantity: '' }],
    ['category', { category: '' }],
    ['timeline', { timeline: '' }],
    ['projectStage', { projectStage: '' }],
    ['role', { role: '' }],
    ['consent', { consent: '' }],
  ] as const)('rejects missing %s', (_label, patch) => {
    expect(isValidInquiry(validInput({ ...patch }))).toBe(false)
  })

  test('country alone satisfies the market gate (targetMarket optional)', () => {
    expect(isValidInquiry(validInput({ targetMarket: '' }))).toBe(true)
  })
})

describe('scoreInquiry', () => {
  test('fully-specified B2B lead with business email + file → tier A', () => {
    const { score, tier } = scoreInquiry(
      validInput({ businessType: 'brand', quantity: 'q500', projectStage: 'ready', packaging: 'custom' }),
      { hasFile: true },
    )
    expect(score).toBeGreaterThanOrEqual(70)
    expect(tier).toBe('A')
  })

  test('mid-level profile → tier B', () => {
    const { score, tier } = scoreInquiry(
      validInput({ businessType: 'retailer', quantity: 'q50-99', annualVolume: 'v300-999', projectStage: 'developing', packaging: 'export' }),
      { hasFile: false },
    )
    expect(score).toBeGreaterThanOrEqual(40)
    expect(score).toBeLessThan(70)
    expect(tier).toBe('B')
  })

  test('free mail + tiny qty + future stage + price-only message → tier C, clamped ≥ 0', () => {
    const { score, tier } = scoreInquiry(
      validInput({
        email: 'someone@gmail.com',
        businessType: 'other',
        quantity: 'q1-9',
        timeline: 'unsure',
        projectStage: 'future',
        construction: 'need-rec',
        packaging: 'not-decided',
        compliance: 'guidance',
        annualVolume: 'not-decided',
        docs: 'not-decided',
        requirements: 'price?',
      }),
      { hasFile: false },
    )
    expect(score).toBe(0)
    expect(tier).toBe('C')
  })

  test('business email outranks free mail', () => {
    const a = scoreInquiry(validInput({ email: 'buyer@acme-boards.com' }), { hasFile: false }).score
    const b = scoreInquiry(validInput({ email: 'buyer@gmail.com' }), { hasFile: false }).score
    expect(a).toBe(b + 20)
  })

  test('uploaded file adds the lead-quality bonus', () => {
    const without = scoreInquiry(validInput(), { hasFile: false }).score
    const withFile = scoreInquiry(validInput(), { hasFile: true }).score
    expect(withFile).toBe(without + 15)
  })

  test('price-only messages are penalized but full briefs are not', () => {
    const spammy = scoreInquiry(validInput({ requirements: 'send me price' }), { hasFile: false }).score
    const brief = scoreInquiry(validInput(), { hasFile: false }).score
    expect(spammy).toBeLessThan(brief)
  })

  test('score equals the sum of its signals (single source of truth)', () => {
    const input = validInput()
    const { score } = scoreInquiry(input, { hasFile: true })
    const sum = inquiryScoreSignals(input, { hasFile: true }).reduce((acc, s) => acc + s.delta, 0)
    expect(score).toBe(Math.max(0, sum))
    expect(inquiryScoreSignals(input, { hasFile: true }).some((s) => s.id === 'fileUploaded')).toBe(true)
  })
})

describe('fileExtension', () => {
  test('extracts a lowercased extension and tolerates missing/empty names', () => {
    expect(fileExtension('logo.PNG')).toBe('png')
    expect(fileExtension('drawing.v2.dwg')).toBe('dwg')
    expect(fileExtension('no-extension')).toBe('')
    expect(fileExtension('')).toBe('')
    expect(fileExtension('.hidden')).toBe('hidden')
  })
})

function fileBytes(...values: unknown[]): Uint8Array<ArrayBuffer> {
  const parts = values.map((v) => (typeof v === 'string' ? Uint8Array.from([...v].map((c) => c.charCodeAt(0))) : Uint8Array.from(v as number[])))
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

describe('checkProjectFile', () => {
  test('accepts allowed extensions up to 10 MB', () => {
    const file = new File([fileBytes('hello')], 'brief.pdf', { type: 'application/pdf' })
    expect(checkProjectFile(file)).toEqual({ ok: true })
  })

  test('extension check is case-insensitive', () => {
    const file = new File([fileBytes('x')], 'ARTWORK.SVG')
    expect(checkProjectFile(file)).toEqual({ ok: true })
  })

  test('rejects unknown extensions even with a crowd-pleasing MIME type', () => {
    const file = new File([fileBytes('x')], 'notes.txt', { type: 'image/png' })
    expect(checkProjectFile(file).reason).toBe('type')
    const exe = new File([fileBytes('MZ')], 'setup.exe')
    expect(checkProjectFile(exe).reason).toBe('type')
  })

  test('rejects empty files and files over 10 MB', () => {
    const empty = new File([], 'empty.png', { type: 'image/png' })
    expect(checkProjectFile(empty).reason).toBe('empty')
    const big = new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], 'big.zip')
    expect(checkProjectFile(big).reason).toBe('size')
  })
})

describe('sniffProjectFile', () => {
  test.each([
    ['png', 'png', fileBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'rest')],
    ['jpg', 'jpg', fileBytes([0xff, 0xd8, 0xff, 0xe0])],
    ['jpeg', 'jpeg', fileBytes([0xff, 0xd8, 0xff, 0xdb])],
    ['webp', 'webp', fileBytes('RIFF', [0, 0, 0, 0], 'WEBP')],
    ['svg', 'svg', fileBytes('<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
    ['svg with xml prolog', 'svg', fileBytes('<?xml version="1.0"?><svg viewBox="0 0 10 10"></svg>')],
    ['pdf', 'pdf', fileBytes('%PDF-1.7\n')],
    ['ai (PDF-based)', 'ai', fileBytes('%PDF-1.5\n%âãÏÓ')],
    ['ai (EPS-based)', 'ai', fileBytes('%!PS-Adobe-3.0\n')],
    ['psd', 'psd', fileBytes([0x38, 0x42, 0x50, 0x53], 'bogus')],
    ['dwg', 'dwg', fileBytes('AC1015\r\n')],
    ['dxf text', 'dxf', fileBytes('\r\n0\nSECTION\n2\nHEADER')],
    ['dxf binary', 'dxf', fileBytes('AutoCAD Binary DXF')],
    ['zip', 'zip', fileBytes([0x50, 0x4b, 0x03, 0x04], 'bogus')],
    ['zip empty archive', 'zip', fileBytes([0x50, 0x4b, 0x05, 0x06], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])],
  ] as const)('accepts genuine %s bytes', (_label, ext, bytes) => {
    expect(sniffProjectFile(bytes, ext)).toBe(true)
  })

  test('rejects mismatched magic numbers', () => {
    expect(sniffProjectFile(fileBytes([0xff, 0xd8, 0xff]), 'png')).toBe(false)
    expect(sniffProjectFile(fileBytes('<svg></svg>'), 'pdf')).toBe(false)
    expect(sniffProjectFile(fileBytes('%PDF-1.7'), 'dwg')).toBe(false)
    expect(sniffProjectFile(fileBytes([0x89, 0x50]), 'png')).toBe(false)
  })

  test('rejects script-first masquerades as svg', () => {
    expect(sniffProjectFile(fileBytes('<script>alert(1)</script>'), 'svg')).toBe(false)
  })

  test('rejects HTML taller than the svg form', () => {
    expect(sniffProjectFile(fileBytes('<!DOCTYPE html><html><body>0</body></html>'), 'svg')).toBe(false)
  })

  test('empty payload never sniffs true', () => {
    expect(sniffProjectFile(new Uint8Array(0), 'pdf')).toBe(false)
  })

  test('unknown extension never sniffs true', () => {
    expect(sniffProjectFile(fileBytes('%PDF-1.7'), 'txt')).toBe(false)
  })
})
