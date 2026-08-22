import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Home, Settings, Gauge, Users, Menu, ClipboardList, PanelLeftClose, PanelLeftOpen, MessageSquare, Inbox } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { UserMenu } from '@/components/app/user-menu'
import { SITE_NAME } from '@/config/site'

const rootRoute = getRouteApi('__root__')

const COLLAPSE_KEY = 'sidebar-collapsed'

export interface ShellUser {
  name?: string | null
  email: string
  role?: string | null
  image?: string | null
}

/**
 * Shared sidebar + topbar shell for every signed-in surface. One unified nav:
 * Workspace + Account for everyone, plus an Admin group rendered only for
 * `role === 'admin'` (non-admins get no hint the console exists). Admin routes
 * stay under /admin with their own gate — only the navigation is merged.
 *
 * Desktop sidebar collapses to an icon rail; the choice sticks across pages
 * via localStorage (applied after mount so SSR markup stays deterministic).
 */
export function AppShell({
  user,
  active,
  crumb,
  children,
}: {
  user: ShellUser
  active: string
  crumb: string
  children: ReactNode
}) {
  const { theme } = rootRoute.useLoaderData()
  const { t } = useTranslation()
  const fl = useLocalizePath()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'), [])
  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1')
      return !v
    })
  }, [])

  // `rail` = collapsed icon rail (desktop only; the mobile drawer is always full-width)
  const sidebar = (rail: boolean) => {
    const item = (isActive: boolean) =>
      `app-nav-item ${isActive ? 'active' : ''} ${rail ? 'justify-center' : ''}`
    const label = (text: string) => (rail ? null : text)
    // group boundaries: text label expanded, slim centered divider on the rail
    const grp = (text: string) =>
      rail ? <div className="mx-auto my-2 h-px w-6 bg-border" aria-hidden="true" /> : <div className="grp">{text}</div>
    return (
      <>
        <div className={rail ? 'brand justify-center' : 'brand'}>
          <Logo compact={rail} />
        </div>
        {grp(t('app.navWorkspace'))}
        <a href={fl('/app')} className={item(active === 'dashboard')} title={t('app.dashboard')}>
          <Home size={18} className="shrink-0" />
          {label(t('app.dashboard'))}
        </a>
        <a href={fl('/app/feedback')} className={item(active === 'feedback')} title={t('feedback.nav')}>
          <MessageSquare size={18} className="shrink-0" />
          {label(t('feedback.nav'))}
        </a>
        {grp(t('app.navAccount'))}
        <a href={fl('/app/account')} className={item(active === 'account')} title={t('app.account')}>
          <Settings size={18} className="shrink-0" />
          {label(t('app.account'))}
        </a>
        {user.role === 'admin' && (
          <>
            {grp(t('admin.navAdmin'))}
            <a href={fl('/admin')} className={item(active === 'admin-dashboard')} title={t('admin.dashboard')}>
              <Gauge size={18} className="shrink-0" />
              {label(t('admin.dashboard'))}
            </a>
            <a href={fl('/admin/users')} className={item(active === 'admin-users')} title={t('admin.users')}>
              <Users size={18} className="shrink-0" />
              {label(t('admin.users'))}
            </a>
            <a href={fl('/admin/waitlist')} className={item(active === 'admin-waitlist')} title={t('admin.waitlist')}>
              <ClipboardList size={18} className="shrink-0" />
              {label(t('admin.waitlist'))}
            </a>
            <a href={fl('/admin/inquiries')} className={item(active === 'admin-inquiries')} title={t('admin.inquiries')}>
              <Inbox size={18} className="shrink-0" />
              {label(t('admin.inquiries'))}
            </a>
            <a href={fl('/admin/feedback')} className={item(active === 'admin-feedback')} title={t('admin.feedbackAdmin')}>
              <MessageSquare size={18} className="shrink-0" />
              {label(t('admin.feedbackAdmin'))}
            </a>
          </>
        )}
        <div className="flex-1" />
        <UserMenu user={user} rail={rail} />
      </>
    )
  }

  return (
    <div className={`min-h-screen md:grid ${collapsed ? 'md:grid-cols-[64px_1fr]' : 'md:grid-cols-[248px_1fr]'}`}>
      {/* desktop sidebar — the plain-utility wrapper does the hiding: `.app-side`
          sets display:flex in unlayered CSS, which outranks the layered `hidden`
          utility, so `hidden` directly on the aside has no effect on mobile */}
      <div className="hidden md:block">
        {/* no px override here — .app-side's unlayered padding (12px) outranks
            padding utilities anyway, and it happens to fit the 64px rail */}
        <aside className="app-side h-full">{sidebar(collapsed)}</aside>
      </div>

      {/* mobile drawer (always full-width, never the rail) */}
      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="app-side fixed inset-y-0 left-0 z-50 w-[248px]" onClick={() => setOpen(false)}>
            {sidebar(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <div className="app-topbar">
          <button
            type="button"
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg text-fg-2 hover:bg-bg-alt hover:text-foreground md:hidden"
            aria-label={t('common.menu')}
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            className="hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg text-fg-2 hover:bg-bg-alt hover:text-foreground md:inline-flex"
            aria-label={collapsed ? t('app.expandSidebar') : t('app.collapseSidebar')}
            title={collapsed ? t('app.expandSidebar') : t('app.collapseSidebar')}
            onClick={toggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
          <span className="app-crumb">
            <span className="hidden md:inline">
              {SITE_NAME} <span className="mx-1.5 text-fg-3">/</span>
            </span>
            <b>{crumb}</b>
          </span>
          <div className="flex-1" />
          <ThemeToggle theme={theme} />
          <LangSwitch />
        </div>
        <div className="app-main">
          {children}
        </div>
      </div>
    </div>
  )
}
