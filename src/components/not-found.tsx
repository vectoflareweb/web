/**
 * 默认 404 页（router 的 defaultNotFoundComponent）。
 * 可能渲染在 I18nProvider / locale 布局之外，故用 useLocation 推断 /es 前缀，
 * 渲染西语文案 + 普通 <a> 回首页（`/` 始终解析到默认语言；用普通 anchor
 * 避免 typed-route 约束，404 整页跳转可接受）。
 * meta noindex 走 React 19 提升（SSR 生效）；<title> 与 TSR head 流集成会
 * 提升成空标签，故在客户端用 useEffect 设置（SSR 阶段无 title 可接受——
 * 404 页已 noindex，标题仅供浏览器标签）。 */
import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { getLocaleFromPath, getDictionary, translate, localizePath } from '@/features/i18n/locale'
import { SITE_NAME } from '@/config'
import { SECONDARY_CTA } from '@/components/marketing/cta-styles'

export function NotFound() {
  const { pathname } = useLocation()
  const locale = getLocaleFromPath(pathname)
  const d = getDictionary(locale)
  const t = (key: string) => translate(d, key)
  const docTitle = t('content.page.notFound') + ` \u2014 ${SITE_NAME}`
  useEffect(() => {
    document.title = docTitle
    document.documentElement.lang = locale
  }, [docTitle, locale])
  return (
    <>
      <meta name="robots" content="noindex" />
      <main className="grid-bg flex min-h-screen flex-col items-center justify-center gap-[18px] p-8 text-center">
      <span className="kicker">// {t('content.page.notFoundSub')}</span>
      <div className="font-display text-[80px] md:text-[120px] font-bold leading-none tracking-[-4px] text-primary">404</div>
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.6px]">
        {t('content.page.notFound')}
      </h1>
      <p className="m-0 max-w-[30em] text-base leading-relaxed text-fg-2">
        {t('content.page.notFoundBody')}
      </p>
      <a
        href={localizePath(locale, '/')}
        className="inline-flex h-13 items-center gap-2 rounded-[6px] bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {t('content.page.backToHome')}
      </a>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a href={localizePath(locale, '/products')} className={SECONDARY_CTA}>
          {t('content.page.browsePlatforms')}
        </a>
        <a href={localizePath(locale, '/contact')} className={SECONDARY_CTA}>
          {t('content.page.contactUs')}
        </a>
      </div>
      </main>
    </>
  )
}