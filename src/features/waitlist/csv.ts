import type { WaitlistRow } from './getWaitlist'

function cell(v: string): string {
  // Neutralize spreadsheet formula prefixes (CSV injection): Excel/Sheets execute
  // cells starting with = + - @; a leading apostrophe forces text. Costs a stray
  // quote on legit values like "-50%" — acceptable for an admin export.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(rows: WaitlistRow[]): string {
  const header = 'email,locale,source,created_at'
  const body = rows.map((r) => {
    const created = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
    return [cell(r.email), cell(r.locale), cell(r.source), cell(created)].join(',')
  })
  return [header, ...body].join('\n') + '\n'
}
