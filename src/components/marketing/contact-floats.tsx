import { useCallback, useEffect, useRef, useState } from 'react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { useFocusTrap } from '@/lib/use-focus-trap'
import { BRAND_CONTACT } from '@/config/branding'

const SCROLL_DELTA_THRESHOLD = 4
const MIN_SCROLL_Y = 140
const COPY_FEEDBACK_MS = 2000
const WA_URL = BRAND_CONTACT.whatsappLink
const WECHAT_DISPLAY = BRAND_CONTACT.whatsapp.replace(/(\+86)(\d{3})(\d{4})(\d{4})/, '$1 $2 $3 $4')

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.643-.947-1.004-2.067-1.004-3.252 0-3.318 3.278-6.009 7.322-6.009.194 0 .385.012.574.024C15.762 4.917 12.547 2.188 8.691 2.188Zm-2.53 3.892c.571 0 1.034.478 1.034 1.066 0 .587-.463 1.066-1.034 1.066-.57 0-1.033-.479-1.033-1.066 0-.588.463-1.066 1.033-1.066Zm8.167 0c.571 0 1.034.478 1.034 1.066 0 .587-.463 1.066-1.034 1.066-.57 0-1.033-.479-1.033-1.066 0-.588.463-1.066 1.033-1.066ZM24 14.186c0-3.214-3.138-5.819-7.008-5.819-3.871 0-7.008 2.605-7.008 5.819 0 3.213 3.137 5.818 7.008 5.818a8.18 8.18 0 0 0 2.33-.331.685.685 0 0 1 .567.077l1.535.899a.26.26 0 0 0 .319-.03.257.257 0 0 0 .069-.223l-.318-1.205a.584.584 0 0 1 .168-.655c1.331-.996 2.338-2.624 2.338-4.35Zm-9.424-1.605c-.452 0-.819-.379-.819-.847 0-.467.367-.846.819-.846.452 0 .818.379.818.846 0 .468-.366.847-.818.847Zm4.833 0c-.452 0-.819-.379-.819-.847 0-.467.367-.846.819-.846.452 0 .818.379.818.846 0 .468-.366.847-.818.847Z" />
    </svg>
  )
}

export function ContactFloats() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const wechatTrap = useFocusTrap(open)
  const [copied, setCopied] = useState(false)
  const [hidden, setHidden] = useState(false)
  const fl = useLocalizePath()
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  // Hide while scrolling down (and when reading the page footer), reappear on scroll up.
  useEffect(() => {
    let lastY = window.scrollY
    let raf = 0
    let cancelled = false
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (cancelled) return
        const y = window.scrollY
        const delta = y - lastY
        if (delta > SCROLL_DELTA_THRESHOLD && y > MIN_SCROLL_Y) setHidden(true)
        else if (delta < -SCROLL_DELTA_THRESHOLD) setHidden(false)
        lastY = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelled = true
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const copyWeChat = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(WECHAT_DISPLAY)
    } catch {
      /* clipboard unavailable — the number stays visible for manual entry */
    }
    setCopied(true)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
  }, [])

  const wechatPanel = open ? (
    <div
      ref={wechatTrap}
      className="flex w-[300px] flex-col items-center rounded-xl border border-border bg-bg p-4 shadow-lg"
      role="dialog"
      aria-label={t('sup.contactWeChat')}
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
    >
      <img
        src="/assets/wechat-qr.jpg"
        alt={t('sup.contactWeChat')}
        width={192}
        height={192}
        loading="lazy"
        className="h-48 w-auto rounded-lg border border-border-2 bg-white p-1.5"
      />
      <p className="mt-3 text-center text-[13px] font-medium text-foreground">{t('sup.contactWeChatHint')}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[13.5px] text-fg-2">{WECHAT_DISPLAY}</span>
          <button
            type="button"
            onClick={copyWeChat}
            className="rounded-md bg-primary px-2 py-1 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <span role="status" aria-live="polite">{copied ? t('sup.contactCopied') : t('sup.contactCopy')}</span>
          </button>
        </div>
    </div>
  ) : null

  return (
    <>
      <div
        className={`fixed bottom-5 right-5 z-50 hidden flex-col items-end gap-3 transition-all duration-300 md:flex ${
          hidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {wechatPanel}
        <div className="flex items-center gap-2">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('sup.contactWhatsApp')}
            title={t('sup.contactWhatsApp')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-transform hover:scale-105"
          >
            <WhatsAppIcon />
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('sup.contactWeChat')}
            aria-expanded={open}
            title={t('sup.contactWeChat')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#07C160] text-white shadow-md transition-transform hover:scale-105"
          >
            <WeChatIcon />
          </button>
        </div>
      </div>

      {/* mobile sticky contact bar */}
      <div
        role="toolbar"
        aria-label={t('sup.contactToolbar')}
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 md:hidden ${
          hidden ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {open && (
          <div className="absolute bottom-full left-4 right-4 mb-3 flex justify-center">{wechatPanel}</div>
        )}
        <div className="flex items-center gap-2.5">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('sup.contactWhatsApp')}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] text-[14px] font-bold text-white"
          >
            <WhatsAppIcon />
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('sup.contactWeChat')}
            aria-expanded={open}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#07C160] text-[14px] font-bold text-white"
          >
            <WeChatIcon />
          </button>
          <a
            href={fl('/contact')}
            className="sun-grad flex h-11 flex-1 items-center justify-center rounded-full text-[14px] font-bold text-white"
          >
            {t('sup.contactQuote')}
          </a>
        </div>
      </div>
    </>
  )
}
