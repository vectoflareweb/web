import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/features/i18n/provider'
import { uploadAvatar } from '../actions'
import { AVATAR_ACCEPT, validateAvatar, MAX_AVATAR_BYTES } from '../storage'

export function AvatarUploader({ image, name }: { image?: string | null; name: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const src = preview ?? image ?? undefined
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    // Client-side guard mirrors the server's rules for instant feedback.
    const check = validateAvatar({ type: file.type, size: file.size })
    if (!check.ok) {
      setError(t(`storage.${check.reason}`))
      return
    }

    setError(null)
    setBusy(true)
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await uploadAvatar({ data: form })
      if (!res.ok) {
        setError(t(`storage.${res.reason}`))
        setPreview(null)
        URL.revokeObjectURL(blobUrl)
        return
      }
      URL.revokeObjectURL(blobUrl)
      router.invalidate()
    } catch {
      // 网络断开/会话过期等：给出可重试的报错；finally 复位 busy，按钮不再永久卡死
      setError(t('storage.failed'))
      setPreview(null)
      URL.revokeObjectURL(blobUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="grid size-16 place-items-center overflow-hidden rounded-full bg-bg-2 text-xl font-semibold text-fg-2">
        {src ? <img src={src} alt={name} width={48} height={48} loading="lazy" decoding="async" className="size-full object-cover" /> : initial}
      </div>
      <div className="grid gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? t('storage.uploading') : t('storage.changeAvatar')}
        </Button>
        {error ? (
          <p className="m-0 text-sm text-destructive">{error}</p>
        ) : (
          <p className="m-0 text-[13px] text-fg-3">
            {t('storage.avatarHint', { mb: String(MAX_AVATAR_BYTES / (1024 * 1024)) })}
          </p>
        )}
      </div>
    </div>
  )
}
