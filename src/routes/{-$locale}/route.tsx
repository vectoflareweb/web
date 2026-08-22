import { Suspense, lazy } from 'react'
import { createFileRoute, Outlet, redirect, notFound } from '@tanstack/react-router'
import { I18nProvider } from '@/features/i18n/provider'
import { isLocale, defaultLocale, stripDefaultLocalePrefix, type Locale } from '@/features/i18n/locale'
// ImpersonationBanner 拉到懒加载：它依赖 better-auth client（~30KB），但只有管理员
// 模拟登录时才渲染——静态引入会把 auth client 拖进每个页面的首屏 preload。
const ImpersonationBanner = lazy(() => import('@/features/admin/components/impersonation-banner'))

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params, location }) => {
    const loc = (params as { locale?: string }).locale
    if (loc === undefined) return                  // en (no prefix) — ok
    if (loc === defaultLocale) {                    // '/en/...' → strip to canonical no-prefix
      // href (not pathname) so query/hash survive — /en/contact?ref=x 带参回跳
      throw redirect({ href: stripDefaultLocalePrefix(location.href), statusCode: 301 })
    }
    if (!isLocale(loc)) throw notFound()            // unknown segment
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useParams() as { locale?: string }
  const resolved: Locale = isLocale(locale) ? locale : defaultLocale
  return (
    <I18nProvider locale={resolved}>
      <Suspense fallback={null}>
        <ImpersonationBanner />
      </Suspense>
      <Outlet />
    </I18nProvider>
  )
}
