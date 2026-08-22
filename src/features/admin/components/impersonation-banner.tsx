import { useRouter } from '@tanstack/react-router'
import { Eye, LogOut } from 'lucide-react'
import { authClient, useSession } from '@/features/auth/auth.client'
import { useTranslation } from '@/features/i18n/provider'

export default function ImpersonationBanner() {
  const { data } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  const impersonatedBy = (data?.session as { impersonatedBy?: string | null } | undefined)?.impersonatedBy
  if (!impersonatedBy) return null
  async function exit() {
    await authClient.admin.stopImpersonating()
    router.invalidate()
  }
  return (
    <div className="impersonation-bar sticky top-0 z-50">
      <Eye size={18} />
      <span className="flex-1">{t('admin.impersonating', { email: data?.user?.email ?? '' })}</span>
      <button
        type="button"
        onClick={exit}
        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-white/40 bg-white/20 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/30"
      >
        <LogOut size={15} /> {t('admin.exitImpersonation')}
      </button>
    </div>
  )
}
