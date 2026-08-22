import { test, expect } from 'vitest'
import { createDevTransport } from '@/features/email/dev-transport'

test('dev transport 捕获邮件而不真发', async () => {
  const t = createDevTransport()
  await t.send({ to: 'a@b.com', subject: 'Verify', html: '<a href="https://x/verify?t=1">go</a>', text: 'https://x/verify?t=1' })
  expect(t.captured).toHaveLength(1)
  expect(t.captured[0].to).toBe('a@b.com')
  expect(t.captured[0].subject).toBe('Verify')
  expect(t.captured[0].text).toContain('verify?t=1')
})
