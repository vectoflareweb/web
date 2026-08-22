import { createServerFn } from '@tanstack/react-start'
import type { Inquiry } from './inquiry.schema'
import type { InquiryTier, ProjectFileExtension } from './inquiry.shared'
import { SITE_NAME } from '@/config/site'
import { BRAND_CONTACT } from '@/config/branding'
import type { Locale } from '@/features/i18n/locale'

export type SubmitResult =
  | { ok: true; tier: InquiryTier }
  | {
      ok: false
      reason: 'invalid' | 'captcha' | 'rate-limited' | 'file-empty' | 'file-type' | 'file-size' | 'failed'
    }

/**
 * Public, unauthenticated endpoint: accepts the inquiry form as FormData
 * (fields + optional project file). Validator hardens the fields; the handler
 * rate-limits per IP, verifies Turnstile, stores the file in R2, scores the
 * lead (tier A/B/C), persists the inquiry to D1 and notifies the admin list.
 */
export const submitInquiry = createServerFn({ method: 'POST' })
  .validator((d: FormData) => d)
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    const { fixedWindowLimit } = await import('@/features/waitlist/rate-limit')
    const { verifyTurnstile } = await import('@/features/waitlist/turnstile')
    const { clampInquiryInput, isValidInquiry, checkProjectFile, fileExtension, sniffProjectFile, scoreInquiry } = await import('./inquiry.shared')
    const { putInquiryFile } = await import('./inquiry.server')
    const { inquiry } = await import('./inquiry.schema')
    const { sendInquiryNotification } = await import('./notify')

    // 每 IP 5 次 / 10 分钟：容得下真人修改重试，挡得住脚本刷库。KV 故障时放行（fail-open）。
    try {
      const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'
      const allowed = await fixedWindowLimit(env.CACHE, `inquiry:${ip}`, 5, 600, Date.now())
      if (!allowed) return { ok: false, reason: 'rate-limited' }
    } catch (err) {
      console.error('[inquiry] rate limit check failed (allowing)', err)
    }

    const input = clampInquiryInput({
      company: data.get('company'),
      website: data.get('website'),
      country: data.get('country'),
      email: data.get('email'),
      whatsapp: data.get('whatsapp'),
      businessType: data.get('businessType'),
      quantity: data.get('quantity'),
      category: data.get('category'),
      timeline: data.get('timeline'),
      targetMarket: data.get('targetMarket'),
      projectStage: data.get('projectStage'),
      role: data.get('role'),
      boardPlatform: data.get('boardPlatform'),
      construction: data.get('construction'),
      customization: data.get('customization'),
      packaging: data.get('packaging'),
      compliance: data.get('compliance'),
      docs: data.get('docs'),
      annualVolume: data.get('annualVolume'),
      budget: data.get('budget'),
      nda: data.get('nda'),
      consent: data.get('consent'),
      requirements: data.get('requirements'),
    })
    const locale = data.get('locale') === 'es' ? 'es' : 'en'

    // 字段校验先于 Turnstile：token 一经 siteverify 即作废（见 waitlist 注释）。
    if (!isValidInquiry(input)) return { ok: false, reason: 'invalid' }

    const ok = await verifyTurnstile(
      typeof data.get('turnstileToken') === 'string' ? (data.get('turnstileToken') as string) : '',
      env.TURNSTILE_SECRET_KEY,
    )
    if (!ok) return { ok: false, reason: 'captcha' }

    const file = data.get('projectFile')
    if (file instanceof File && file.size > 0) {
      const check = checkProjectFile(file)
      if (!check.ok) {
        return { ok: false, reason: check.reason === 'size' ? 'file-size' : check.reason === 'empty' ? 'file-empty' : 'file-type' }
      }
    }

    const { score, tier } = scoreInquiry(input, { hasFile: file instanceof File && file.size > 0 })

    const id = crypto.randomUUID()
    const now = new Date()

    let logoKey: string | null = null
    try {
      if (file instanceof File && file.size > 0) {
        const bytes = await file.arrayBuffer()
        // Magic-number sniff before the R2 write: the file is later served back
        // to admins, so a spoofed name/type must not smuggle arbitrary bytes in.
        const ext = fileExtension(file.name) as ProjectFileExtension
        if (!sniffProjectFile(new Uint8Array(bytes), ext)) return { ok: false, reason: 'file-type' }
        logoKey = await putInquiryFile(env.BUCKET, id, bytes, ext)
      }
    } catch (err) {
      console.error('[inquiry] logo upload failed', err)
      return { ok: false, reason: 'failed' }
    }

    const row: Inquiry = {
      id,
      name: input.company || 'inquiry',
      model: 'unsure', // legacy column — kept for historical rows
      ...input,
      logoKey,
      score,
      tier,
      status: 'new',
      locale,
      createdAt: now,
    }
    try {
      await createDb(env.DB).insert(inquiry).values(row)
    } catch (err) {
      console.error('[inquiry] insert failed', err)
      return { ok: false, reason: 'failed' }
    }

    // Notification is best-effort — a mail outage must not block the submission.
    try {
      const admins = (env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean)
      await sendInquiryNotification(env.RESEND_API_KEY || null, env.EMAIL_FROM || `${SITE_NAME} <${BRAND_CONTACT.email}>`, admins, {
        inquiry: row,
        fileUrl: logoKey ? `${new URL(env.BETTER_AUTH_URL).origin}/api/inquiry-logo/${id}` : null,
        origin: new URL(env.BETTER_AUTH_URL).origin,
      })
    } catch (err) {
      console.error('[inquiry] admin notification failed', err)
    }

    // Best-effort ack to the submitter — reassurance cuts lead drop-off; a mail
    // outage must not block the submission (dev transport captures locally).
    try {
      const { sendEmail } = await import('@/features/email/email.server')
      await sendEmail({ to: input.email, locale: (row.locale ?? 'en') as Locale, template: 'inquiry-ack', data: { tier } })
    } catch (err) {
      console.error('[inquiry] ack email failed', err)
    }

    return { ok: true, tier }
  })