import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { SearchEntry } from '@/features/site/search'
import { TYPE_CLASS } from '@/features/site/search-type-class'
import { useTranslation } from '@/features/i18n/provider'
import { useFocusTrap } from '@/lib/use-focus-trap'

const FOCUS_DELAY_MS = 30
const MAX_RESULTS = 12
let cachedSearchIndex: SearchEntry[] | null = null

/** Site-wide search dialog — lazily fetches `/search-index.json`, filters by
 * the current locale, and navigates on selection. The `/` shortcut opens it;
 * Enter submits to the /search results page. */
export function SearchDialog({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchEntry[] | null>(cachedSearchIndex)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTrap = useFocusTrap(open)

  const submit = useCallback((e?: { preventDefault: () => void }) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    onClose()
    navigate({ to: '/{-$locale}/search', search: { q } })
  }, [query, onClose, navigate])

  useEffect(() => {
    if (open) {
      if (!index) {
        const ac = new AbortController()
        fetch('/search-index.json', { signal: ac.signal })
          .then((r) => (r.ok ? r.json() : []))
          .then((data) => { cachedSearchIndex = data as SearchEntry[]; setIndex(cachedSearchIndex) })
          .catch((e) => { if (!ac.signal.aborted) { console.error('[search-index]', e); setIndex([]) } })
        return () => ac.abort()
      }
      const focusTimer = setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY_MS)
      return () => clearTimeout(focusTimer)
    } else {
      setQuery('')
    }
  }, [open, index])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        onOpen()
      }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onOpen, onClose])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchTrap.current && !searchTrap.current.contains(e.target as Node)) onClose()
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  const q = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q || !index) return []
    return index
      .filter((it) => it.locale === locale && (it.title.toLowerCase().includes(q) || it.excerpt.toLowerCase().includes(q) || (it.content ?? '').toLowerCase().includes(q)))
      .slice(0, MAX_RESULTS)
  }, [q, index, locale])

  if (!open) return null

  return (
    <div ref={searchTrap} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t('common.search')}>
      <div className="mx-auto mt-20 w-[92vw] max-w-2xl">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)]">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SearchIcon size={18} className="shrink-0 text-fg-3" />
            <form onSubmit={submit} className="flex min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => startTransition(() => setQuery(e.target.value))}
                placeholder={t('common.searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-fg-3"
                autoComplete="off"
              />
            </form>
            <button type="button" onClick={submit} aria-label={t('common.search')} className="shrink-0 rounded-md bg-primary px-3 py-1 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
              {t('common.search')}
            </button>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[11px] text-fg-3">Esc</kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!q && <p className="px-3 py-6 text-center text-sm text-fg-3">{t('common.searchStart')}</p>}
            {q && matches.length === 0 && <p className="px-3 py-6 text-center text-sm text-fg-3">{t('common.searchNone')}</p>}
            {q && matches.length > 0 && (
              <ul>
                {matches.map((m) => (
                  <li key={`${m.locale}${m.url}`}>
                    <a
                      href={m.url}
                      onClick={() => onClose()}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring,hsl(217_91%_60%))]"
                    >
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_CLASS[m.type]}`}>
                        {t(`common.type${m.type[0].toUpperCase()}${m.type.slice(1)}`)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{m.title}</span>
                        {m.excerpt && <span className="block truncate text-xs text-fg-3">{m.excerpt}</span>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
