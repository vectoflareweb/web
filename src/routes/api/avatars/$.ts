import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { getAvatar } from '@/features/storage/storage.server'

/**
 * Stream a user's avatar from R2. R2 objects aren't public by default, so this
 * route is the read side — `user.image` points here. Avatars are non-sensitive,
 * so no auth gate; the userId is the last path segment.
 */
const handler = async ({ request }: { request: Request }) => {
  let userId = ''
  try {
    userId = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  } catch {
    // 畸形百分号编码（如 /%E0%A4%A）→ 404，而不是未捕获的 URIError 500
  }
  const object = userId ? await getAvatar(env.BUCKET, userId) : null
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  if (object.httpMetadata?.contentType) headers.set('Content-Type', object.httpMetadata.contentType)
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=60') // short: url is cache-busted on re-upload
  // 头像也是用户上传内容（R2 对象 MIME 由上传者声明）：对响应强制沙箱，
  // 防止未来 MIME 白名单扩展引入可执行格式（如 SVG）时以顶层文档打开执行脚本。
  // 与 /api/inquiry-logo 同一套纵深防御。
  headers.set('Content-Security-Policy', "default-src 'none'; sandbox")
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(object.body, { headers })
}

export const Route = createFileRoute('/api/avatars/$')({
  server: { handlers: { GET: handler } },
})
