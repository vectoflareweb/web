/**
 * notify HTML-injection regression test (security): every user-controlled field
 * of the inquiry must be HTML-escaped in the admin notification email, so an
 * anonymous /contact submission can't smuggle markup into the admin's inbox.
 */
import { test, expect, beforeEach, vi } from 'vitest'

const { captured } = vi.hoisted(() => ({
  captured: [] as Array<{ to: string; subject: string; html: string; text: string }>,
}))

vi.mock('@/features/email/dev-transport', () => ({
  createDevTransport: () => ({
    captured,
    async send(email: { to: string; subject: string; html: string; text: string }) {
      captured.push(email)
    },
  }),
}))

import { sendInquiryNotification } from '@/features/inquiry/notify'
import type { Inquiry } from '@/features/inquiry/inquiry.schema'

function inquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: 'inq-test',
    name: 'Test',
    company: '',
    website: '',
    country: '',
    email: 'a@b.com',
    whatsapp: '',
    businessType: 'other',
    quantity: 'unsure',
    category: 'unsure',
    model: 'unsure',
    timeline: 'now',
    targetMarket: '',
    projectStage: '',
    role: '',
    boardPlatform: '',
    construction: '',
    customization: '',
    packaging: '',
    compliance: '',
    docs: '',
    annualVolume: '',
    budget: '',
    nda: 'no',
    consent: '',
    score: 0,
    tier: 'C',
    requirements: '',
    logoKey: null,
    status: 'new',
    locale: 'en',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

beforeEach(() => {
  captured.length = 0
})

test('HTML 部分转义所有用户输入，标签/属性边界无法形成', async () => {
  await sendInjectionEmail()
  expect(captured).toHaveLength(1)
  const html = captured[0].html

  // 不允许出现真实的元素边界（< 被转义，标签无法形成）
  expect(html.match(/<img/i)).toBeNull()
  expect(html.match(/<script/i)).toBeNull()

  // 注入载荷整体被转义成纯文本
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  expect(html).toContain('&lt;a href=&quot;javascript:alert(1)&quot;&gt;')

  // Email 行的 mailto 链接：引号被转义，无法跳出 href 属性
  expect(html).toContain('mailto:x&quot; onmouseover=&quot;alert(1)@b.com')
  expect(html).not.toContain('x" onmouseover="alert(1)@b.com')

  // Logo 行链接：引号被转义，无法跳出 href 属性
  expect(html).toContain('https://example.com/logo.svg&quot; onload=&quot;alert(1)')
  expect(html).not.toContain('logo.svg" onload="alert(1)')
})

test('干净输入原样保留', async () => {
  await sendInquiryNotification(null, 'from@vectoflare.com', ['admin@vectoflare.com'], {
    inquiry: inquiry({ company: 'Acme GmbH', email: 'sales@acme.com', requirements: 'Need 500 units' }),
    fileUrl: null,
    origin: 'https://vectoflare.com',
  })
  expect(captured).toHaveLength(1)
  const html = captured[0].html
  expect(html).toContain('Acme GmbH')
  expect(html).toContain('sales@acme.com')
  expect(html).toContain('Need 500 units')
})

async function sendInjectionEmail() {
  await sendInquiryNotification(null, 'from@vectoflare.com', ['admin@vectoflare.com'], {
    inquiry: inquiry({
      company: '<img src=x onerror=alert(1)>',
      website: '"><a href="javascript:alert(1)">x</a>',
      email: `x" onmouseover="alert(1)@b.com`,
      requirements: `</td></tr></table><script>alert(1)</script>`,
      logoKey: 'inquiry-files/inq-test.pdf',
    }),
    fileUrl: `https://example.com/logo.svg" onload="alert(1)`,
    origin: 'https://vectoflare.com',
  })
}

test('邮件 Files 行带文件扩展名徽章（从 R2 key 派生，转义后输出）', async () => {
  await sendInquiryNotification(null, 'from@vectoflare.com', ['admin@vectoflare.com'], {
    inquiry: inquiry({ logoKey: 'inquiry-files/inq-7.dwg' }),
    fileUrl: 'https://vectoflare.com/api/inquiry-logo/inq-7',
    origin: 'https://vectoflare.com',
  })
  expect(captured).toHaveLength(1)
  expect(captured[0].text).toContain('DWG — https://vectoflare.com/api/inquiry-logo/inq-7')
  expect(captured[0].html).toContain('View upload (DWG)')
})
