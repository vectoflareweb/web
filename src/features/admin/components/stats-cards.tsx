import { Users, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/features/i18n/provider'
import type { AdminStats } from '@/features/admin/middleware'

export function StatsCards({ stats }: { stats: AdminStats }) {
  const { t } = useTranslation()

  const cards = [
    { Icon: Users, label: t('admin.totalUsers'), value: stats.totalUsers },
    { Icon: Activity, label: t('admin.activeUsers'), value: stats.activeUsers },
  ]

  return (
    <div className="grid gap-3.5">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map(({ Icon, label, value }) => (
          <Card key={label} className="rounded-xl px-5 py-[18px]">
            <div className="flex items-center gap-2 text-[13px] text-fg-3">
              <Icon size={16} /> {label}
            </div>
            <div className="font-display text-[30px] font-semibold tabular-nums tracking-[-0.8px] my-2 mb-1">
              {value.toLocaleString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
