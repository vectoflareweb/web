import React, { startTransition, useState, useMemo } from 'react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, products, productFilters, type Product } from '@/product/content'
import { Reveal } from './reveal'

/** Single catalog card: real product photo with sku/price chips, then brand-book details. */
function ProductCardInner({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { t } = useTranslation()
  const fl = useLocalizePath()
  return (
    <a
      href={fl(`/products/${product.slug}`)}
      className="group block h-full text-current"
    >
      <div className="marine-card flex h-full flex-col overflow-hidden p-0 transition-transform duration-300 group-hover:-translate-y-1">
      <div className="zoom-img relative aspect-[3/4] overflow-hidden border-b border-border-2 bg-bg-alt">
        <img
          src={product.image}
          alt={product.name}
          width={600}
          height={800}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'auto' : 'async'}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-fg-3 backdrop-blur">
            {product.sku}
          </span>
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1 text-[12px] font-extrabold text-primary-foreground shadow-[var(--shadow-md)]">
          {t('marketing.oemOdmBadge')}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="pill self-start border-primary/25! bg-soft! text-primary!">{product.tagline}</span>
        <h3 className="mt-3.5 font-display text-[18px] font-bold">{product.name}</h3>
        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{product.desc}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.uses.map((u) => (
            <span key={u} className="pill">{u}</span>
          ))}
        </div>
        <p className="mt-4 border-t border-border pt-3.5 text-[12.5px] font-semibold text-fg-2">{product.specs}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-fg-3">{product.artwork}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-fg-3">{t('marketing.recommendedFor')}</span>
          {product.for.map((f) => (
            <span key={f} className="rounded-md bg-soft px-2 py-0.5 text-[12px] font-bold text-primary">
              {f}
            </span>
          ))}
        </div>
      </div>
      </div>
    </a>
  )
}
export const ProductCard = React.memo(ProductCardInner)

/** Products grid (catalog style) shared by home and /products (the page passes its own header).
 *  Pass `active`/`onActiveChange` to mirror the filter into the URL (e.g. ?platform=race). */
export function ProductsSection({
  heading,
  limit,
  active,
  onActiveChange,
}: {
  heading?: React.ReactNode
  limit?: number
  active?: string
  onActiveChange?: (key: string) => void
}) {
  const { locale, t } = useTranslation()
  const c = pick(products, locale)
  const filters = pick(productFilters, locale)
  const [internalActive, setInternalActive] = useState('all')
  const current = onActiveChange
    ? active !== undefined && filters.groups.some((g) => g.key === active)
      ? active
      : 'all'
    : internalActive
  const change = onActiveChange ?? setInternalActive
  const allItems = limit ? c.items.slice(0, limit) : c.items
  const items = useMemo(() => current === 'all' ? allItems : allItems.filter((p) => p.series === current), [allItems, current])

  return (
    <section aria-label={t('marketing.filterResults', { count: items.length })} className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      {heading ?? null}
      {!limit && (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            aria-label={t('marketing.filterAllAria', { label: filters.all })}
            onClick={() => startTransition(() => change('all'))}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              current === 'all' ? 'bg-primary text-primary-foreground' : 'border border-border-2 text-fg-2 hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {filters.all}
          </button>
          {filters.groups.map((g) => (
            <button
              key={g.key}
              type="button"
              aria-label={t('marketing.filterGroupAria', { label: g.label })}
              onClick={() => startTransition(() => change(current === g.key ? 'all' : g.key))}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                current === g.key ? 'bg-primary text-primary-foreground' : 'border border-border-2 text-fg-2 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {t('marketing.filterResults', { count: items.length })}
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.slug} delay={i * 80}>
            <ProductCard product={p} priority={i === 0} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
