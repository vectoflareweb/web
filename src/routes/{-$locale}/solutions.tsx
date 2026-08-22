import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MarketingShell } from '@/components/marketing/shell'

export const Route = createFileRoute('/{-$locale}/solutions')({
  component: SolutionsLayout,
})

function SolutionsLayout() {
  return (
    <MarketingShell>
      <Outlet />
    </MarketingShell>
  )
}
