import { Plus } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { pick, faq, type FaqContent, type Localized } from '@/product/content'
import { SectionHead } from './section-head'
import { faqSlug } from '@/features/ai/rag'

export function FaqSection({ heading, data }: { heading?: React.ReactNode; data?: Localized<FaqContent> }) {
  const { locale } = useTranslation()
  const c = pick(data ?? faq, locale)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const toggle = useCallback((q: string) => {
    setOpenItems((prev) => { const next = new Set(prev); if (next.has(q)) next.delete(q); else next.add(q); return next })
  }, [])

  return (
    <section className="mx-auto max-w-3xl px-5 py-20 md:px-7 md:py-24">
      {heading ?? (
        <SectionHead
          kicker={c.kicker}
          title={c.title}
          sub={c.sub}
        />
      )}
      <div className="mt-12 flex flex-col gap-3">
        {c.items.map((item) => {
          const anchor = faqSlug(item.q)
          const isOpen = openItems.has(item.q)
          return (
            <details key={item.q} id={anchor} className="faq-row scroll-mt-24" open={isOpen} onToggle={() => toggle(item.q)}>
              <summary aria-expanded={isOpen}>
                {item.q}
                <Plus size={17} className="faq-icon" aria-hidden="true" />
              </summary>
              <div className="faq-body">{item.a}</div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
