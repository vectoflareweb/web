import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAdmin } from '@/features/admin/middleware'

export const Route = createFileRoute('/{-$locale}/admin')({
  loader: () => requireAdmin(),
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: () => <Outlet />,
})
