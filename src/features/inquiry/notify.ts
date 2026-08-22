/**
 * Admin notification for new project inquiries. Uses Resend when configured,
 * falls back to the console-capturing dev transport otherwise — matching the
 * project's graceful-degradation convention (see features/email).
 */
import { createDevTransport, type SentEmail } from '@/features/email/dev-transport'
import type { Inquiry } from './inquiry.schema'
import { SITE_NAME } from '@/config'

export interface InquiryNotifyData {
  inquiry: Inquiry
  fileUrl: string | null
  origin: string
}

export async function sendInquiryNotification(apiKey: string | null, from: string, to: string[], data: InquiryNotifyData): Promise<void> {
  if (to.length === 0) return
  const transport: { send(email: SentEmail): Promise<void> } = apiKey
    ? {
        async send(email) {
          const { Resend } = await import('resend')
          const resend = new Resend(apiKey)
          const { error } = await resend.emails.send({ from, to, subject: email.subject, html: email.html, text: email.text })
          if (error) throw new Error(`Resend send failed: ${error.name}: ${error.message}`)
        },
      }
    : createDevTransport({ redactBody: import.meta.env.PROD })

  const i = data.inquiry
  // Attachment type for the admin mail — derived from the R2 object key.
  const fileExt = i.logoKey ? (i.logoKey.split('.').pop() ?? '').toUpperCase() : ''
  const subject = `[${SITE_NAME}] [${i.tier}] ${i.businessType} inquiry: ${i.company || i.email} (${i.category}, score ${i.score})`
  const text = [
    `Lead tier: ${i.tier} (score ${i.score})`,
    `Company: ${i.company || '—'}`,
    `Website: ${i.website || '—'}`,
    `Country: ${i.country || '—'} · Target market: ${i.targetMarket || '—'}`,
    `Email: ${i.email}`,
    `WhatsApp: ${i.whatsapp || '—'}`,
    `Business type: ${i.businessType}`,
    `Product category: ${i.category}`,
    `Quantity: ${i.quantity} · Annual volume: ${i.annualVolume || '—'}`,
    `Timeline: ${i.timeline} · Project stage: ${i.projectStage || '—'}`,
    `Role: ${i.role || '—'} · Board platform: ${i.boardPlatform || '—'}`,
    `Construction: ${i.construction || '—'} · Packaging: ${i.packaging || '—'}`,
    `Customization: ${i.customization || '—'} | Compliance: ${i.compliance || '—'}`,
    `Docs/testing: ${i.docs || '—'} | Budget: ${i.budget || '—'} | NDA: ${i.nda}`,
    `Requirements: ${i.requirements || '—'}`,
    `Files: ${data.fileUrl ? `${fileExt} — ${data.fileUrl}` : 'none'}`,
    `Submitted: ${i.createdAt.toISOString()}`,
  ].join('\n')
  const e = esc
  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">',
    `<h2 style="color:#0b2540">New project inquiry — Tier ${e(i.tier)} (score ${e(String(i.score))})</h2>`,
    '<table style="border-collapse:collapse;width:100%;font-size:14px">',
    row('Company', e(i.company)),
    row('Website', e(i.website)),
    row('Country / market', `${e(i.country)}${i.targetMarket ? ` / ${e(i.targetMarket)}` : ''}`),
    row('Email', `<a href="mailto:${e(i.email)}">${e(i.email)}</a>`),
    row('WhatsApp', e(i.whatsapp)),
    row('Business type', e(i.businessType)),
    row('Product category', e(i.category)),
    row('Quantity / annual volume', `${e(i.quantity)}${i.annualVolume ? ` / ${e(i.annualVolume)}` : ''}`),
    row('Timeline / stage', `${e(i.timeline)}${i.projectStage ? ` / ${e(i.projectStage)}` : ''}`),
    row('Role / board platform', `${e(i.role)}${i.boardPlatform ? ` / ${e(i.boardPlatform)}` : ''}`),
    row('Construction / packaging', `${e(i.construction)}${i.packaging ? ` / ${e(i.packaging)}` : ''}`),
    row('Customization', e(i.customization)),
    row('Compliance', e(i.compliance)),
    row('Docs / testing', e(i.docs)),
    row('Budget', e(i.budget)),
    row('NDA', e(i.nda)),
    row('Requirements', e(i.requirements)),
    row('Files', data.fileUrl ? `<a href="${e(data.fileUrl)}">View upload${fileExt ? ` (${e(fileExt)})` : ''}</a>` : '—'),
    '</table>',
    `<p style="color:#7c8b9c;font-size:12px">Submitted at ${i.createdAt.toISOString()} · locale ${e(i.locale)}</p>`,
    '</div>',
  ].join('')
  await transport.send({ to: to[0], subject, html, text })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function row(label: string, value: string) {
  return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e4e0d4;color:#46586c;font-weight:700;white-space:nowrap">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e4e0d4">${value || '—'}</td></tr>`
}
