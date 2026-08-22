import { getRouteApi } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { useResolvedTheme } from '@/features/theme/use-resolved-theme'

const rootRoute = getRouteApi('__root__')

/**
 * Sonner <Toaster> mounted only on pages that actually emit toasts (app/admin
 * surfaces). Keeps the ~64KB sonner library out of the eager marketing bundle.
 * Theme follows the same DOM-first resolution as __root used to apply.
 */
export function AppToaster() {
  const { theme } = rootRoute.useLoaderData()
  const resolved = useResolvedTheme(theme)
  return <Toaster theme={resolved} />
}
