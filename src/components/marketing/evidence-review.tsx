import { useTranslation } from '@/features/i18n/provider'
import { FACTS_VERIFIED } from '@/product/facts'

interface EvidenceReviewProps {
  reviewedBy?: string
  factoryLocation?: string
  lastVerified?: string
  evidenceAvailable?: string[]
  commercialNote?: string
}

export function EvidenceReview({
  reviewedBy = 'Manufacturing Engineering Team',
  factoryLocation = 'Laixi, Qingdao, China',
  lastVerified = FACTS_VERIFIED,
  evidenceAvailable,
  commercialNote,
}: EvidenceReviewProps) {
  const { t } = useTranslation()

  const defaultEvidence = [
    t('content.evidence.certificates'),
    t('content.evidence.qcRecords'),
    t('content.evidence.testReports'),
    t('content.evidence.batchTraceability'),
  ]

  const items = evidenceAvailable ?? defaultEvidence

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 md:px-7">
      <div className="rounded-2xl border border-border bg-soft/40 p-6 md:p-8">
        <h3 className="font-display text-[15px] font-bold uppercase tracking-wide text-fg-3">
          {t('content.evidence.title')}
        </h3>
        <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-fg-2">
          <p>
            <span className="font-semibold text-fg-1">{t('content.evidence.reviewedBy')}:</span> {reviewedBy}
          </p>
          <p>
            <span className="font-semibold text-fg-1">{t('content.evidence.location')}:</span> {factoryLocation}
          </p>
          <p>
            <span className="font-semibold text-fg-1">{t('content.evidence.lastVerified')}:</span> {lastVerified}
          </p>
        </div>
        {items.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-fg-3">{t('content.evidence.available')}:</p>
            <ul className="flex flex-wrap gap-2">
              {items.map((item) => (
                <li key={item} className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-fg-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {commercialNote && (
          <p className="mt-4 border-t border-border pt-4 text-[12.5px] leading-relaxed text-fg-3">
            {commercialNote}
          </p>
        )}
      </div>
    </section>
  )
}
