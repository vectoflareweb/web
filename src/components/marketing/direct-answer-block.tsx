export function DirectAnswerBlock({
  answer,
  condition,
  value,
  verifiedDate,
  sourceType,
  sourceUrl,
}: {
  answer: string
  condition?: string
  value?: string
  verifiedDate?: string
  sourceType?: string
  sourceUrl?: string
}) {
  return (
    <div className="direct-answer-block rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 md:px-7">
      <p className="text-[15px] font-semibold leading-relaxed">{answer}</p>
      {value && (
        <p className="mt-2 text-[14px] font-bold text-primary">{value}</p>
      )}
      {condition && (
        <p className="mt-1.5 text-[13px] leading-snug text-fg-2">{condition}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11.5px] font-medium text-fg-3">
        {verifiedDate && (
          <span>Last verified: {verifiedDate}</span>
        )}
        {sourceType && (
          <span className="rounded bg-bg-alt px-2 py-0.5">{sourceType}</span>
        )}
        {sourceUrl && (
          <a href={sourceUrl} className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
            Evidence
          </a>
        )}
      </div>
    </div>
  )
}
