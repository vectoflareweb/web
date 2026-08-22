import { Globe } from 'lucide-react'
import { defaultLocale, type Locale } from './locale'
import { LOCALE_LABELS, ACTIVE_LOCALES } from '@/config/locales'
import { useTranslation } from './provider'

function switchLocaleTo(target: Locale) {
  const { pathname, search, hash } = window.location
  const currentPrefix = pathname.match(/^\/([a-z]{2}(-[A-Z]{2})?)(?=\/|$)/)?.[1]
  const stripped = currentPrefix ? pathname.slice(currentPrefix.length + 1) : pathname
  const clean = stripped || '/'
  const newPath =
    target === defaultLocale ? clean : `/${target}${clean === '/' ? '' : clean}`
  const url = newPath + search + hash
  document.cookie = `locale=${target}; path=/; max-age=31536000; samesite=lax`
  window.location.href = url
}

export function LangSwitch() {
  const { locale, t } = useTranslation()

  if (ACTIVE_LOCALES.length < 2) return null

  const activeLocales = ACTIVE_LOCALES as readonly Locale[]
  const currentIdx = activeLocales.indexOf(locale)
  const nextIdx = (currentIdx + 1) % activeLocales.length
  const next = activeLocales[nextIdx === -1 ? 1 : nextIdx]
  const label = LOCALE_LABELS[next] ?? { native: next, short: next.toUpperCase() }

  function handleSwitch() {
    switchLocaleTo(next)
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={t('common.language')}
      className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-sm font-semibold text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground"
    >
      <Globe size={17} />
      <span>{label.short}</span>
    </button>
  )
}
