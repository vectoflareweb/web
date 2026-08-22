import React, { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Sun, Moon } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { useResolvedTheme } from '@/features/theme/use-resolved-theme'

function ThemeToggleInner({ theme }: { theme: 'light' | 'dark' }) {
  const router = useRouter()
  const { t } = useTranslation()
  const resolved = useResolvedTheme(theme)

  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark'
    document.cookie = `theme=${next}; path=/; max-age=31536000`
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
    }
    router.invalidate()
  }, [resolved, router])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('common.toggleTheme')}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-transparent text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground"
    >
      {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
export const ThemeToggle = React.memo(ThemeToggleInner)
