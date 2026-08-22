import { useCallback, useMemo, useState } from 'react'
import { Menu, X, ChevronDown, Search as SearchIcon } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import { SearchDialog } from '@/components/marketing/search-dialog'
import { useTranslation } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { SITE_NAME } from '@/config/site'
import { useFocusTrap } from '@/lib/use-focus-trap'

const rootRoute = getRouteApi('__root__')

interface SubItem {
  label: string
  href: string
  highlight?: boolean
}

interface NavGroup {
  label: string
  items: SubItem[]
}

interface NavItem {
  label: string
  href?: string
  items?: SubItem[]
  groups?: NavGroup[]
}

/** Sticky marketing header: utility top bar (auth) + main bar with mega-menu
 * navigation (4 top-level sections), search, theme and language controls. */
export function SiteNav() {
  const { theme, user } = rootRoute.useLoaderData()
  const loggedIn = !!user
  const { t } = useTranslation()
  const fl = useLocalizePath()
  const [open, setOpen] = useState(false)
  const mobileTrap = useFocusTrap(open)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const [drop, setDrop] = useState<string | null>(null)
  const [mobileDrop, setMobileDrop] = useState<string | null>(null)

  const linkCls =
    'rounded-md px-3 py-2 text-sm font-medium text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground'

  const navItems: NavItem[] = useMemo(() => [
    {
      label: t('sup.nav.productsServices'),
      groups: [
        {
          label: t('sup.nav.productsServicesDropdown.startGroup'),
          items: [
            { label: t('sup.nav.productsServicesDropdown.startProject'), href: '/start-sup-project', highlight: true },
            { label: t('sup.nav.productsServicesDropdown.all'), href: '/products' },
            { label: t('sup.nav.productsServicesDropdown.customizer'), href: '/customizer' },
          ],
        },
        {
          label: t('sup.nav.productsServicesDropdown.exploreGroup'),
          items: [
            { label: t('sup.nav.productsServicesDropdown.manufacturer'), href: '/oem-manufacturing' },
            { label: t('sup.nav.productsServicesDropdown.constructionComparison'), href: '/sup-construction-comparison' },
            { label: t('sup.nav.productsServicesDropdown.privateLabel'), href: '/solutions/private-label-sup' },
            { label: t('sup.nav.productsServicesDropdown.comparison'), href: '/oem-odm-private-label-comparison' },
            { label: t('sup.nav.productsServicesDropdown.productDevelopment'), href: '/product-development' },
            { label: t('sup.nav.productsServicesDropdown.newBrandTrial'), href: '/new-brand-trial-order' },
            { label: t('sup.nav.productsServicesDropdown.oemPaddle'), href: '/oem-paddle' },
          ],
        },
      ],
    },
    {
      label: t('sup.nav.industries'),
      groups: [
        {
          label: t('sup.nav.industriesDropdown.overviewGroup'),
          items: [
            { label: t('sup.nav.industriesDropdown.overview'), href: '/who-we-serve' },
          ],
        },
        {
          label: t('sup.nav.industriesDropdown.verticalsGroup'),
          items: [
            { label: t('sup.nav.industriesDropdown.resorts'), href: '/solutions/resort-sup' },
            { label: t('sup.nav.industriesDropdown.clubs'), href: '/solutions/club-sup' },
            { label: t('sup.nav.industriesDropdown.rental'), href: '/solutions/rental-operators' },
            { label: t('sup.nav.industriesDropdown.distributors'), href: '/solutions/distributors' },
            { label: t('sup.nav.industriesDropdown.retail'), href: '/solutions/retail-partners' },
          ],
        },
      ],
    },
    {
      label: t('sup.nav.proofQuality'),
      groups: [
        {
          label: t('sup.nav.proofQualityDropdown.evidenceGroup'),
          items: [
            { label: t('sup.nav.proofQualityDropdown.factory'), href: '/factory' },
            { label: t('sup.nav.proofQualityDropdown.proofCenter'), href: '/proof-center' },
            { label: t('sup.nav.proofQualityDropdown.quality'), href: '/quality' },
            { label: t('sup.nav.proofQualityDropdown.complianceByMarket'), href: '/sup-compliance-by-market' },
            { label: t('sup.nav.proofQualityDropdown.auditChecklist'), href: '/factory-audit-checklist' },
            { label: t('sup.nav.proofQualityDropdown.technology'), href: '/technology' },
          ],
        },
        {
          label: t('sup.nav.proofQualityDropdown.casesGroup'),
          items: [
            { label: t('sup.nav.proofQualityDropdown.projects'), href: '/projects' },
            { label: t('sup.nav.proofQualityDropdown.gallery'), href: '/gallery' },
            { label: t('sup.nav.proofQualityDropdown.evidence'), href: '/evidence/case-studies' },
          ],
        },
      ],
    },
    {
      label: t('sup.nav.resources'),
      items: [
        { label: t('sup.nav.resourcesDropdown.knowledge'), href: '/knowledge' },
        { label: t('sup.nav.resourcesDropdown.onboarding'), href: '/oem-onboarding-guide' },
        { label: t('sup.nav.resourcesDropdown.faq'), href: '/faq' },
        { label: t('sup.nav.resourcesDropdown.sizeGuide'), href: '/size-guide' },
        { label: t('sup.nav.resourcesDropdown.moqGuide'), href: '/oem-moq-guide' },
        { label: t('sup.nav.resourcesDropdown.news'), href: '/news' },
      ],
    },
  ], [t])

  const authLink = loggedIn ? (
    <a href={fl('/app')} className="text-[13px] font-semibold text-fg-2 transition-colors hover:text-foreground">
      {t('sup.nav.app')}
    </a>
  ) : (
    <a href={fl('/login')} className="text-[13px] font-semibold text-fg-2 transition-colors hover:text-foreground">
      {t('common.signIn')}
    </a>
  )

  const cta = (
    <a href={fl('/start-sup-project')} className={buttonVariants({ size: 'sm' })}>
      {t('sup.nav.cta')}
    </a>
  )

  const renderNavLink = (item: SubItem, onNavigate?: () => void) => (
    <a
      href={fl(item.href)}
      className={`${linkCls} ${item.highlight ? 'font-bold text-primary!' : ''}`}
      onClick={onNavigate}
    >
      {item.label}
    </a>
  )

  const renderDesktopItem = (item: NavItem) => {
    if (!item.items && !item.groups) {
      if (!item.href) return null
      return renderNavLink({ label: item.label, href: item.href })
    }
    const isOpen = drop === item.label

    const flatItems = item.items ?? item.groups?.flatMap((g) => g.items) ?? []
    const hasGroups = !!item.groups && item.groups.length > 1

    return (
      <div
        className="relative"
        onMouseEnter={() => setDrop(item.label)}
        onMouseLeave={() => setDrop(null)}
      >
        <button
          type="button"
          className={`${linkCls} inline-flex items-center gap-1`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setDrop(isOpen ? null : item.label)}
        >
          {item.label}
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute left-0 top-full pt-2">
            <div className={`rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-lg)] ${hasGroups ? 'grid grid-cols-2 gap-x-2 min-w-[520px]' : 'min-w-[230px]'}`}>
              {hasGroups && item.groups ? (
                item.groups.map((group) => (
                  <div key={group.label} className="min-w-[200px]">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-3">{group.label}</p>
                    {group.items.map((sub) => (
                      <div key={sub.label}>{renderNavLink(sub, () => setDrop(null))}</div>
                    ))}
                  </div>
                ))
              ) : (
                flatItems.map((sub) => (
                  <div key={sub.label}>{renderNavLink(sub, () => setDrop(null))}</div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMobileItems = (items: NavItem[]) =>
    items.map((item) => {
      const flatItems = item.items ?? item.groups?.flatMap((g) => g.items) ?? []
      if (flatItems.length === 0) {
        if (!item.href) return null
        return <div key={item.label}>{renderNavLink({ label: item.label, href: item.href }, () => setOpen(false))}</div>
      }
      const isOpen = mobileDrop === item.label
      return (
        <div key={item.label} className="flex flex-col">
          <button
            type="button"
            className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-foreground"
            onClick={(e) => { e.stopPropagation(); setMobileDrop(isOpen ? null : item.label) }}
            aria-expanded={isOpen}
          >
            {item.label}
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className="flex flex-col border-l border-border pl-3">
              {item.groups ? (
                item.groups.map((group) => (
                  <div key={group.label}>
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-3">{group.label}</p>
                    {group.items.map((sub) => (
                      <div key={sub.label}>{renderNavLink(sub, () => setOpen(false))}</div>
                    ))}
                  </div>
                ))
              ) : (
                flatItems.map((sub) => (
                  <div key={sub.label}>{renderNavLink(sub, () => setOpen(false))}</div>
                ))
              )}
            </div>
          )}
        </div>
      )
    })

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg">
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b border-border/80 shadow-[var(--shadow-sm)] backdrop-blur">
        {/* top bar — auth utilities above the main nav */}
        <div className="flex h-9 items-center justify-end gap-4 border-b border-border/60 px-4 md:px-7">
          {authLink}
        </div>
        <nav aria-label={t('common.mainNav')} className="flex h-16 items-center gap-3 px-4 md:px-7">
          <a href={fl('/')} aria-label={SITE_NAME} className="shrink-0">
            <div className="flex flex-col leading-tight">
              <Logo />
              <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-fg-3">{t('sup.nav.poweredBy')}</span>
            </div>
          </a>
          <div className="flex-1" />

          {/* desktop nav with mega-menus */}
          <div className="hidden items-center gap-0.5 lg:flex">{navItems.map(renderDesktopItem)}</div>

          {/* theme · search · language */}
          <div className="flex items-center gap-1">
            <ThemeToggle theme={theme} />
            <button
              type="button"
              onClick={openSearch}
              aria-label={t('common.search')}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground"
            >
              <SearchIcon />
            </button>
            <LangSwitch />
          </div>
          <div className="hidden lg:block">{cta}</div>

          {/* mobile hamburger */}
          <button
            type="button"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg text-fg-2 hover:bg-bg-alt hover:text-foreground lg:hidden"
            aria-label={t('common.menu')}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {open && (
          <div
            ref={mobileTrap}
            className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.menu')}
          >
            {renderMobileItems(navItems)}
            <div className="mt-2 flex items-center gap-3">{cta}</div>
          </div>
        )}
      </header>
      <SearchDialog open={searchOpen} onOpen={openSearch} onClose={closeSearch} />
    </>
  )
}
