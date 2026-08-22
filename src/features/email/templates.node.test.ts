import { test, expect } from 'vitest'
import { renderEmail } from '@/features/email/templates'
import { SITE_NAME } from '@/config/site'

test('verify-email 模板渲染 i18n 文案 + 注入链接', async () => {
  const out = await renderEmail({ template: 'verify-email', locale: 'en', data: { url: 'https://app/verify?token=abc' } })
  expect(out.subject).toBe('Verify your email')
  expect(out.html).toContain('https://app/verify?token=abc')
  expect(out.html).toContain('Verify email')
  expect(out.text).toContain('https://app/verify?token=abc')
})

test('reset-password 模板支持西班牙语', async () => {
  const out = await renderEmail({ template: 'reset-password', locale: 'es', data: { url: 'https://app/reset?token=xyz' } })
  expect(out.subject).toBe('Restablece tu contraseña')
  expect(out.html).toContain('https://app/reset?token=xyz')
})

test('catalog-request 模板渲染线索文案 EN/ES', async () => {
  const en = await renderEmail({ template: 'catalog-request', locale: 'en', data: { url: 'https://example.org/products' } })
  expect(en.subject).toBe(`We received your catalog request — ${SITE_NAME}`)
  expect(en.html).toContain('https://example.org/products')
  expect(en.html).toContain('within one business day')

  const es = await renderEmail({ template: 'catalog-request', locale: 'es', data: { url: 'https://example.org/es/products' } })
  expect(es.subject).toBe(`Hemos recibido tu solicitud de catálogo — ${SITE_NAME}`)
  expect(es.html).toContain('https://example.org/es/products')
})

test('inquiry-ack 模板无链接、双语渲染回复承诺', async () => {
  const en = await renderEmail({ template: 'inquiry-ack', locale: 'en', data: {} })
  expect(en.subject).toBe(`We received your project inquiry — ${SITE_NAME}`)
  expect(en.html).toContain('MOQ, sample timing and lead times')
  expect(en.html).not.toContain('<a href=')
  expect(en.text).toContain('Inquiry received')

  const es = await renderEmail({ template: 'inquiry-ack', locale: 'es', data: {} })
  expect(es.subject).toBe(`Hemos recibido tu consulta de proyecto — ${SITE_NAME}`)
  expect(es.html).toContain('MOQ, los tiempos de muestra')
})
