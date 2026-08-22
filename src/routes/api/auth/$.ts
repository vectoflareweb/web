import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { createAuth } from '@/features/auth/auth.server'

const ADMIN_PREFIX = '/api/auth/admin/'
// stop-impersonating 由独立强校验保护（会话须带 impersonatedBy + 签名 admin_session
// cookie），且被模拟用户（非 admin）也需要能调用它退出模拟——不能走 assertAdmin 门。
const ADMIN_BYPASS = new Set(['/api/auth/admin/stop-impersonating'])

const handler = async ({ request }: { request: Request }) => {
  const path = new URL(request.url).pathname
  if (path.startsWith(ADMIN_PREFIX) && !ADMIN_BYPASS.has(path)) {
    // better-auth 的管理端点只认 DB role；这里加与 admin 页面/CSV 同一道门
    // （fresh session + ADMIN_EMAILS 真源 + 撤权即降权），否则被移出 ADMIN_EMAILS
    // 的旧管理员仍可凭残留 role 通过 /api/auth/admin/* 越权。
    const { assertAdmin } = await import('@/features/admin/assert-admin.server')
    try {
      await assertAdmin()
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  }
  const auth = createAuth(env, createDb(env.DB))
  return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})
