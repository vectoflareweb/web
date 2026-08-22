import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { assertAdmin } from '@/features/admin/assert-admin.server'
import { listInquiries, type InquiryRow } from '@/features/inquiry/inquiry.server'
import { TIERS, type InquiryTier } from '@/features/inquiry/inquiry.shared'

function cell(v: string): string {
  // Neutralize spreadsheet formula prefixes (CSV injection) — same as waitlist export.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function inquiriesToCsv(rows: InquiryRow[]): string {
  const header =
    'tier,score,category,business_type,project_stage,timeline,quantity,annual_volume,role,board_platform,construction,customization,packaging,compliance,docs,budget,nda,company,website,country,target_market,email,whatsapp,requirements,file,status,locale,created_at'
  const body = rows.map((r) => {
    const created = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
    return [
      cell(r.tier), cell(String(r.score)), cell(r.category), cell(r.businessType),
      cell(r.projectStage), cell(r.timeline), cell(r.quantity), cell(r.annualVolume),
      cell(r.role), cell(r.boardPlatform), cell(r.construction), cell(r.customization),
      cell(r.packaging), cell(r.compliance), cell(r.docs), cell(r.budget), cell(r.nda),
      cell(r.company), cell(r.website), cell(r.country), cell(r.targetMarket),
      cell(r.email), cell(r.whatsapp), cell(r.requirements), cell(r.logoKey ?? ''),
      cell(r.status), cell(r.locale), cell(created),
    ].join(',')
  })
  return [header, ...body].join('\n') + '\n'
}

const handler = async (event: { request: Request }) => {
  try {
    await assertAdmin()
  } catch {
    return new Response('Not Found', { status: 404 })
  }
  // Carry the same filters as the admin page (?tier=A&q=...) so a filtered
  // view exports as-is; unknown tiers fall back to a full export.
  const params = new URL(event.request.url).searchParams
  const tierParam = params.get('tier') ?? ''
  const tier = (TIERS as readonly string[]).includes(tierParam) ? (tierParam as InquiryTier) : undefined
  const q = params.get('q')?.trim().slice(0, 200) || undefined
  const { rows } = await listInquiries(createDb(env.DB), { page: 1, pageSize: 100000, tier, q })
  return new Response(inquiriesToCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="inquiries.csv"',
      'cache-control': 'no-store',
    },
  })
}

export const Route = createFileRoute('/admin/inquiries.csv')({
  server: { handlers: { GET: handler } },
})
