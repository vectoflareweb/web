import * as React from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useFocusTrap(active: boolean) {
  const ref = React.useRef<HTMLDivElement>(null)
  const previouslyFocused = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (active) {
      previouslyFocused.current = document.activeElement as HTMLElement | null
      const el = ref.current
      if (!el) return

      const first = el.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()

      const onKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      el.addEventListener('keydown', onKey)
      return () => el.removeEventListener('keydown', onKey)
    } else {
      previouslyFocused.current?.focus()
      previouslyFocused.current = null
    }
  }, [active])

  return ref
}
