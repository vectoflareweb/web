/**
 * Shared gate: authenticated admin or 404 (non-admins must not learn the admin
 * surface exists). ADMIN_EMAILS is the source of truth; the DB role is a cache
 * kept in sync on every gated access — promotion so better-auth's own admin
 * endpoints (ban/impersonate) accept env-granted admins, demotion so removing
 * an email from ADMIN_EMAILS actually revokes access (the stale DB role or a
 * cached session cookie must not keep the gate open).
 *
 * Lives in a `.server.ts` module so both the admin server fns (middleware.ts)
 * and raw server routes (CSV exports) share the exact same gate — a weaker
 * inline check on any admin surface reopens the revocation bypass.
 */
import { notFound } from '@tanstack/react-router'
import { getRequestHeader } from '@tanstack/react-start/server'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { readUser } from '@/features/auth/readUser.server'
import { createAuth } from '@/features/auth/auth.server'
import { isAdminEmail } from './is-admin'
import { syncAdminRole } from './ensure-admin'

export async function assertAdmin() {
  // fresh：权限最重的面不吃 cookie 缓存——封禁/降权立即生效（普通页面保留 5 分钟缓存省 D1 读）
  const user = await readUser({ fresh: true })
  if (!user) throw notFound()
  if (user.role !== 'admin' && !isAdminEmail(user.email, env.ADMIN_EMAILS)) throw notFound()
  const sync = await syncAdminRole(createDb(env.DB), user, env.ADMIN_EMAILS)
  if (sync === 'demoted') throw notFound() // env 已撤权：DB 角色/会话缓存只是陈迹
  if (sync === 'promoted') {
    // Re-read the session past the cookie cache so the refreshed cookie
    // carries role=admin (otherwise ban/impersonate 403 until it expires).
    const auth = createAuth(env, createDb(env.DB))
    const cookie = getRequestHeader('cookie') ?? ''
    await auth.api.getSession({ headers: new Headers({ cookie }), query: { disableCookieCache: true } })
  }
  return user
}
