/**
 * Admin side drawer for a single inquiry — the full RFQ brief at triage time.
 * Localized option labels reuse the public form's i18n keys, so enum values
 * stay developer-ish in the table but read naturally in the drawer.
 */
import { Calendar, ExternalLink, Mail } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { LOCALE_LABELS } from '@/config/locales'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { fmtDateTime } from '@/lib/format-date'
import { inquiryScoreSignals, PROJECT_IMAGE_EXTENSIONS } from '@/features/inquiry/inquiry.shared'
import type { InquiryRow } from '@/features/inquiry/inquiry.server'

interface Props {
  row: InquiryRow | null
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function InquiryDetailDrawer({ row, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  if (!row) return null

  const opt = (group: string, key: string) => (key ? t(`inquiry.${group}.${key}`) : '—')
  const commaList = (group: string, v: string) =>
    v ? v.split(',').map((x) => x.trim()).filter(Boolean).map((x) => opt(group, x)).join(', ') : '—'
  // Recomputed from the stored fields — the scoring function is deterministic,
  // so this matches the tier assigned at submit time.
  const signals = useMemo(() => inquiryScoreSignals(row, { hasFile: Boolean(row.logoKey) }), [row])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={row.tier === 'A' ? 'ok' : row.tier === 'B' ? 'free' : 'warn'}>
                  Tier {row.tier} · {row.score} pts
                </Badge>
                <Badge variant="free">{t(`inquiry.statuses.${row.status}`)}</Badge>
              </div>
              <DrawerTitle className="mt-2 truncate">{row.company || row.email}</DrawerTitle>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3">
                <span>{row.country || '—'}</span>
                {row.website && (
                  <a className="text-primary hover:underline" href={`https://${row.website}`} target="_blank" rel="noopener noreferrer">{row.website}</a>
                )}
                <span className="inline-flex items-center gap-1"><Calendar size={12} />{fmtDateTime(row.createdAt)}</span>
                <span>{LOCALE_LABELS[row.locale]?.native ?? row.locale}</span>
              </div>
            </div>
            <DrawerClose className="rounded p-1 text-fg-3 hover:bg-bg-alt hover:text-foreground" aria-label={t('admin.closeDrawer')}>✕</DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{t('admin.scoreTitle')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {signals.map((s) => (
                <span
                  key={s.id}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.delta > 0 ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {s.delta > 0 ? '+' : ''}{s.delta} {t(`admin.score.${s.id}`)}
                </span>
              ))}
              {signals.length === 0 && <span className="text-xs text-fg-3">—</span>}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{t('admin.inquiryContact')}</p>
            <div className="mt-2 flex flex-col gap-1.5 text-sm">
              <a className="inline-flex items-center gap-2 text-primary hover:underline" href={`mailto:${row.email}`}>
                <Mail size={14} /> {row.email}
              </a>
              {row.whatsapp && (
                <a className="inline-flex items-center gap-2 text-primary hover:underline" href={`https://wa.me/${row.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> {row.whatsapp}
                </a>
              )}
            </div>
          </div>

          <Field label={t('admin.inquiryType')} value={opt('businessOptions', row.businessType)} />
          <Field label={t('admin.inquiryCategory')} value={opt('categoryOptions', row.category)} />
          <Field label={t('inquiry.projectStage')} value={opt('projectStageOptions', row.projectStage)} />
          <Field label={t('inquiry.role')} value={opt('roleOptions', row.role)} />
          <Field label={t('inquiry.quantity')} value={opt('quantityOptions', row.quantity)} />
          <Field label={t('inquiry.annualVolume')} value={opt('annualVolumeOptions', row.annualVolume)} />
          <Field label={t('inquiry.timeline')} value={opt('timelineOptions', row.timeline)} />
          <Field label={t('inquiry.boardPlatform')} value={row.boardPlatform || '—'} />
          <Field label={t('inquiry.construction')} value={opt('constructionOptions', row.construction)} />
          <Field label={t('inquiry.customization')} value={commaList('customizationOptions', row.customization)} />
          <Field label={t('inquiry.packaging')} value={opt('packagingOptions', row.packaging)} />
          <Field label={t('inquiry.compliance')} value={opt('complianceOptions', row.compliance)} />
          <Field label={t('inquiry.docs')} value={commaList('docsOptions', row.docs)} />
          <Field label={t('admin.inquiryBudget')} value={row.budget || '—'} />
          <Field label={t('inquiry.nda')} value={opt('ndaOptions', row.nda)} />
          <Field label={t('admin.inquiryTargetMarket')} value={row.targetMarket || '—'} />
          <Field label={t('admin.inquiryConsent')} value={row.consent === 'yes' ? 'Yes' : '—'} />

          {row.requirements && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{t('admin.inquiryReq')}</p>
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-border bg-bg-alt p-3 text-[13px] leading-relaxed text-fg-2">{row.requirements}</p>
            </div>
          )}

          {row.logoKey &&
            (() => {
              const ext = row.logoKey.split('.').pop()?.toLowerCase() ?? ''
              const isImage = (PROJECT_IMAGE_EXTENSIONS as readonly string[]).includes(ext)
              return (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{t('admin.inquiryFile')}</p>
                  {isImage ? (
                    <a href={`/api/inquiry-logo/${row.id}`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block">
                      <img
                        src={`/api/inquiry-logo/${row.id}`}
                        alt={row.company || t('admin.inquiryFile')}
                        width={400}
                        height={300}
                        loading="lazy"
                        decoding="async"
                        className="max-h-44 rounded-lg border border-border bg-bg-alt object-contain"
                      />
                    </a>
                  ) : (
                    <a href={`/api/inquiry-logo/${row.id}`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-primary hover:underline">
                      {ext.toUpperCase()} · {t('admin.inquiryFile')}
                    </a>
                  )}
                </div>
              )
            })()}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  )
}