import { createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { AppShell } from '@/components/app/app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/provider'
import { fmtDateTime } from '@/lib/format-date'
import { getInquiriesFn, setInquiryStatusFn } from '@/features/admin/middleware'
import { STATUSES, TIERS, type InquiryStatus, type InquiryTier } from '@/features/inquiry/inquiry.shared'
import { InquiryDetailDrawer } from '@/features/inquiry/components/inquiry-detail-drawer'
import { useAdminUser } from '@/features/admin/use-admin-user'
import { useEffect, useRef, useState } from 'react'

interface InquirySearch {
  page?: number
  pageSize?: number
  tier?: InquiryTier | ''
  q?: string
}

export const Route = createFileRoute('/{-$locale}/admin/inquiries')({
  validateSearch: (s: Record<string, unknown>): InquirySearch => {
    const out: InquirySearch = {}
    if (typeof s.page === 'number') out.page = s.page
    if (typeof s.pageSize === 'number') out.pageSize = s.pageSize
    if (typeof s.tier === 'string' && (TIERS as readonly string[]).includes(s.tier)) out.tier = s.tier as InquiryTier
    if (typeof s.q === 'string' && s.q.trim()) out.q = s.q.slice(0, 200)
    return out
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getInquiriesFn({ data: { page: deps.page ?? 0, pageSize: deps.pageSize ?? 20, tier: deps.tier ?? '', q: deps.q } }),
  component: InquiriesAdmin,
})

function InquiriesAdmin() {
  const { rows, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const user = useAdminUser()
  const { t } = useTranslation()
  const [saving, setSaving] = useState<string | null>(null)
  const [selected, setSelected] = useState<(typeof rows)[number] | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [qInput, setQInput] = useState(search.q ?? '')
  useEffect(() => setQInput(search.q ?? ''), [search.q])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current) }, [])
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const page = search.page ?? 0
  const pageSize = search.pageSize ?? 20
  const tier = search.tier ?? ''
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function setSearch(patch: Partial<InquirySearch>, replace = false) {
    void router.navigate({ to: '/{-$locale}/admin/inquiries', search: { ...search, ...patch }, replace })
  }
  // One request per pause in typing, not per keystroke (each navigate refires the loader).
  function setSearchDebounced(patch: Partial<InquirySearch>) {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearch(patch, true), 300)
  }

  async function updateStatus(id: string, status: InquiryStatus) {
    setSaving(id)
    try {
      await setInquiryStatusFn({ data: { id, status } })
      await router.invalidate()
    } finally {
      setSaving(null)
    }
  }

  const statusLabel = (s: string) => t(`inquiry.statuses.${s}` as `inquiry.statuses.${InquiryStatus}`)

  return (
    <AppShell
      user={user}
      active="admin-inquiries"
      crumb={t('admin.navAdmin')}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.inquiries')} ({total})</h1>
        <a href={`/admin/inquiries.csv${tier ? `?tier=${tier}` : ''}${search.q ? `&q=${encodeURIComponent(search.q)}` : ''}`} className="text-sm text-primary hover:underline">{t('admin.inquiryExport')}</a>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] max-w-[380px] flex-1">
          <span className="lead"><Search size={17} /></span>
          <Input
            className="pl-[38px] pr-9"
            placeholder={t('admin.searchInquiries')}
            value={qInput}
            onChange={(e) => {
              setQInput(e.target.value)
              setSearchDebounced({ q: e.target.value.trim() || undefined, page: 0 })
            }}
          />
          {isLoading && <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-border-strong border-t-primary" />}
        </div>
        <div className="flex items-center gap-1.5">
          {(['', ...TIERS] as Array<InquiryTier | ''>).map((tierKey) => (
            <button
              key={tierKey || 'all'}
              onClick={() => setSearch({ tier: tierKey, page: 0 })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tier === tierKey ? 'bg-primary text-primary-foreground' : 'bg-soft text-fg-3 hover:bg-bg-alt'
              }`}
            >
              {tierKey === '' ? t('admin.tierAll') : `${tierKey}`}
            </button>
          ))}
        </div>
      </div>
      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-fg-3">
              <th scope="col" className="px-4 py-2">{t('admin.inquiryTier')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryCompany')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryCountry')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryEmail')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryType')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryCategory')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryStage')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryQty')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryReq')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryFile')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquiryStatus')}</th>
              <th scope="col" className="px-4 py-2">{t('admin.inquirySubmitted')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer border-t border-border align-top transition-colors hover:bg-bg-alt/60"
                onClick={() => {
                  setSelected(r)
                  setDrawerOpen(true)
                }}
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    r.tier === 'A' ? 'bg-success/15 text-success' : r.tier === 'B' ? 'bg-primary/15 text-primary' : 'bg-soft text-fg-3'
                  }`}>
                    {r.tier} · {r.score}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{r.company || '—'}</td>
                <td className="px-4 py-3">{r.country || '—'}</td>
                <td className="px-4 py-3">
                  <a className="text-primary hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                  {r.whatsapp && (
                    <a className="text-xs text-fg-3 hover:text-primary" href={`https://wa.me/${r.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      {r.whatsapp}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{r.businessType}</td>
                <td className="px-4 py-3 text-xs">{r.category}</td>
                <td className="px-4 py-3 text-xs">
                  <p>{r.projectStage || '—'}</p>
                  {r.timeline && <p className="text-fg-3">{r.timeline}</p>}
                </td>
                <td className="px-4 py-3 text-xs">{r.quantity}</td>
                <td className="max-w-[240px] px-4 py-3 text-xs leading-relaxed text-fg-2">{r.requirements || '—'}</td>
                <td className="px-4 py-3">
                  {r.logoKey ? (() => {
                    const ext = r.logoKey.split('.').pop()?.toUpperCase() ?? ''
                    return (
                      <a className="text-primary hover:underline" href={`/api/inquiry-logo/${r.id}`} target="_blank" rel="noopener noreferrer">
                        {ext} · {t('admin.inquiryFile')}
                      </a>
                    )
                  })() : (
                    <span className="text-fg-3">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    disabled={saving === r.id}
                    onChange={(e) => void updateStatus(r.id, e.target.value as InquiryStatus)}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-fg-3">{fmtDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-sm text-fg-3">
            {t(search.q || tier ? 'admin.inquiryNoResults' : 'admin.noInquiries')}
          </p>
        )}
      </Card>
      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="text-sm text-fg-3">{t('admin.pageOf', { page: page + 1, total: totalPages })}</span>
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setSearch({ page: page - 1, pageSize })}>
          <ChevronLeft size={15} />
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setSearch({ page: page + 1, pageSize })}>
          <ChevronRight size={15} />
        </Button>
      </div>
      <InquiryDetailDrawer row={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </AppShell>
  )
}
