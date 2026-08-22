import { test, expect, vi } from 'vitest'
import { sendEmailWith, resendTransport } from '@/features/email/email.server'
import { createDevTransport } from '@/features/email/dev-transport'

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async () => ({ data: null, error: { name: 'validation_error', message: 'domain is not verified' } }),
    }
  },
}))

test('resendTransport 把 Resend API 错误抛出（SDK 自己不抛，静默吞掉=验证邮件丢失无日志）', async () => {
  const t = resendTransport('re_key', 'X <x@example.com>')
  await expect(t.send({ to: 'u@x.com', subject: 's', html: '<p>s</p>', text: 's' }))
    .rejects.toThrow('domain is not verified')
})

test('sendEmailWith 经 transport 发送渲染后的邮件', async () => {
  const t = createDevTransport()
  await sendEmailWith(t, { to: 'u@x.com', locale: 'en', template: 'verify-email', data: { url: 'https://app/v?t=1' } })
  expect(t.captured).toHaveLength(1)
  expect(t.captured[0].subject).toBe('Verify your email')
  expect(t.captured[0].html).toContain('https://app/v?t=1')
})
