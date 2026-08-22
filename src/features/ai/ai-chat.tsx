import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { dictionaries } from '@/features/i18n/locale'
import { useFocusTrap } from '@/lib/use-focus-trap'

interface ChatSource {
  title: string
  url: string
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  mode?: 'ai' | 'faq'
}

const MAX_HISTORY = 6

const DISCLAIMER = 'Information provided by our AI assistant is for reference only and may not always be 100% accurate. If you have any doubts or specific inquiries, please contact our support team directly.'

let nextId = 0

export function AiChat() {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const chatTrap = useFocusTrap(open)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, busy, error, open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(async (raw: string) => {
    const question = raw.trim()
    if (!question || busy) return
    const history = messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }))
    const firstQuestion = messages.length === 0
    setMessages((m) => [...m, { id: nextId++, role: 'user', content: question }])
    setInput('')
    setBusy(true)
    setError(false)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, history, locale }),
      })
      const data = (await res.json()) as { answer?: string; sources?: ChatSource[]; mode?: 'ai' | 'faq' }
      if (!res.ok || !data.answer) throw new Error('empty answer')
      const answer = data.answer
      const sources = data.sources
      const mode = data.mode
      setMessages((m) => [...m, { id: nextId++, role: 'assistant', content: answer, sources, mode }])
      if (firstQuestion) {
        setMessages((m) => [...m, { id: nextId++, role: 'assistant', content: DISCLAIMER }])
      }
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }, [messages, busy, locale])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('sup.aiChat.open')}
        aria-expanded={open}
        className="fixed bottom-24 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:right-5"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div
          ref={chatTrap}
          className="fixed bottom-[8.5rem] right-4 z-[60] flex h-[480px] w-[min(92vw,380px)] max-h-[62vh] flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl md:right-5"
          role="dialog"
          aria-modal="true"
          aria-label={t('sup.aiChat.title')}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-foreground">{t('sup.aiChat.title')}</p>
              <p className="text-[12px] text-fg-3">{t('sup.aiChat.subtitle')}</p>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3" aria-live="polite" aria-atomic="false">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {(dictionaries[locale].sup.aiChat.chips as readonly string[]).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => send(chip)}
                    className="rounded-xl border border-border bg-bg px-3 py-2 text-left text-[13px] text-fg-2 transition-colors hover:border-primary hover:text-foreground"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm border border-border bg-background text-foreground'
                  }`}
                >
                  {m.content}
                  {m.role === 'assistant' && m.mode && (
                    <span className={`ml-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                      m.mode === 'ai' ? 'bg-primary/10 text-primary' : 'bg-fg-3/10 text-fg-3'
                    }`}>
                      {m.mode === 'ai' ? 'AI' : 'FAQ'}
                    </span>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 border-t border-border/60 pt-2">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-fg-3">
                        {t('sup.aiChat.sources')}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {m.sources.map((s) => (
                          <li key={s.url}>
                            <a
                              href={s.url}
                              className="text-[12.5px] text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                            >
                              {s.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-[13px] text-fg-3" role="status">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                {t('sup.aiChat.thinking')}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-[13px] text-fg-2">
                {t('sup.aiChat.error')}
                <button
                  type="button"
                  onClick={() => send(messages[messages.length - 1]?.content ?? '')}
                  className="ml-2 font-semibold text-primary underline underline-offset-2"
                >
                  {t('sup.aiChat.retry')}
                </button>
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('sup.aiChat.placeholder')}
              maxLength={1000}
              aria-label={t('sup.aiChat.placeholder')}
              className="min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-[13.5px] text-foreground outline-none placeholder:text-fg-3 focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('sup.aiChat.send')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
