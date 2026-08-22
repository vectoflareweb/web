import * as React from 'react'

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const [reducedMotion, setReducedMotion] = React.useState(false)

  React.useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-in')
            io.disconnect()
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  return (
    <Tag ref={ref as never} className={`reveal ${className ?? ''}`} style={delay && !reducedMotion ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  )
}
