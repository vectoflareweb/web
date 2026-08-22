import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, captcha } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import type { DB } from '@/db/client'
import * as schema from './auth.schema'
import { adminRoles } from './admin-roles'
import { sendEmail } from '@/features/email/email.server'
import { negotiateLocale, defaultLocale, type Locale } from '@/features/i18n/locale'
import { isAdminEmail } from '@/features/admin/is-admin'

export interface AuthEnv {
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  ADMIN_EMAILS?: string
  TURNSTILE_SECRET_KEY?: string
  RESEND_API_KEY?: string
}

/** Derive the user's preferred locale from an incoming Better-Auth hook request. */
function localeFromRequest(request?: Request): Locale {
  if (!request) return defaultLocale
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookieLocale = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('locale='))
    ?.split('=')[1]
  const acceptLanguage = request.headers.get('accept-language')
  return negotiateLocale(cookieLocale, acceptLanguage)
}

function socialProviders(e: AuthEnv) {
  const p: Record<string, { clientId: string; clientSecret: string }> = {}
  if (e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET)
    p.google = { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET }
  if (e.GITHUB_CLIENT_ID && e.GITHUB_CLIENT_SECRET)
    p.github = { clientId: e.GITHUB_CLIENT_ID, clientSecret: e.GITHUB_CLIENT_SECRET }
  return p
}

export function createAuth(authEnv: AuthEnv, db: DB) {
  return betterAuth({
    secret: authEnv.BETTER_AUTH_SECRET,
    baseURL: authEnv.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    emailAndPassword: {
      enabled: true,
      // 只在真能发邮件时强制验证：缺 RESEND_API_KEY 时验证邮件只进日志（dev transport），
      // 强制会把所有注册用户永久锁在「请先验证邮箱」外——遵循「key 缺失 → 功能关闭」约定。
      requireEmailVerification: Boolean(authEnv.RESEND_API_KEY),
      sendResetPassword: async ({ user, url }, request) => {
        const locale = localeFromRequest(request)
        await sendEmail({ to: user.email, locale, template: 'reset-password', data: { url } })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }, request) => {
        const locale = localeFromRequest(request)
        await sendEmail({ to: user.email, locale, template: 'verify-email', data: { url } })
      },
    },
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    // Per-IP rate limiting on auth endpoints. Built-in rules already throttle
    // sign-in/sign-up (3/10s) and send-verification/password-reset (3/60s).
    // On Workers: memory storage is per-isolate (useless), so persist in D1;
    // and the trusted client IP is cf-connecting-ip, not x-forwarded-for.
    rateLimit: { enabled: true, storage: 'database' },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    socialProviders: socialProviders(authEnv),
    // Auto-link a social login to an existing account with the same email, but
    // only for providers that return a *verified* email (GitHub, Google). This
    // lets someone who first signed up with email/password also log in via
    // GitHub instead of hitting "account not linked". Untrusted providers still
    // require explicit linking, so an unverified email can't take over an account.
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['github', 'google'],
      },
    },
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              role: isAdminEmail(user.email, authEnv.ADMIN_EMAILS) ? 'admin' : 'user',
            },
          }),
        },
      },
    },
    // Bot protection on sign-up/sign-in/password-reset — only when a secret key
    // is configured, so blank env degrades gracefully (no captcha, like OAuth).
    plugins: [
      admin({
        // 最小权限：后台 UI 实际只用 ban/unban/impersonate/removeUser（用户列表走
        // 自定义 getAdminUsers，不走 listUsers）。只保留这些 + 只读 list，撤掉
        // create/update/set-role/set-password/set-email/get 等改密改权原语——
        // 即使 role 被外部篡改成 admin，这些高危端点也无权调用。role 与 ADMIN_EMAILS
        // 的同步由 assertAdmin 门（./routes/api/auth/$.ts）负责。
        roles: adminRoles,
      }),
      tanstackStartCookies(),
      ...(authEnv.TURNSTILE_SECRET_KEY
        ? [captcha({ provider: 'cloudflare-turnstile', secretKey: authEnv.TURNSTILE_SECRET_KEY })]
        : []),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
