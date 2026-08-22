import { useEffect, useState } from 'react'

export function useResolvedTheme(ssrTheme: 'light' | 'dark'): 'light' | 'dark' {
  const [theme, setTheme] = useState(ssrTheme)
  useEffect(() => {
    const resolved = document.documentElement.classList.contains('light') ? 'light' : 'dark'
    setTheme((prev) => (prev === resolved ? prev : resolved))
  }, [])
  return theme
}
