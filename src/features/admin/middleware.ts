import { createServerFn } from '@tanstack/react-start'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { assertAdmin } from './assert-admin.server'
import { clampPage, clampPageSize, clampSortDir } from './params'
import { getAdminStats, type AdminStats } from './admin.server'
import { getAdminUsers, type AdminUsersParams, type AdminUserRow } from './getAdminUsers'
import { getWaitlist, type WaitlistRow } from '@/features/waitlist/getWaitlist'
import { listFeedbackForAdmin, setFeedbackStatus, type AdminFeedbackRow } from '@/features/feedback/feedback.server'
import type { FeedbackStatus } from '@/features/feedback/feedback.shared'
import { listInquiries, setInquiryStatus, type InquiryRow } from '@/features/inquiry/inquiry.server'
import { STATUSES, TIERS, type InquiryStatus, type InquiryTier } from '@/features/inquiry/inquiry.shared'

export type { AdminStats }
export type { AdminUserRow }
export type { WaitlistRow }
export type { AdminFeedbackRow }
export type { InquiryRow }

/** 仅管理员可过；非管理员 → 404（不泄露 admin 存在）。返回 admin user。 */
export const requireAdmin = createServerFn({ method: 'GET' }).handler(() => assertAdmin())

/** server fn：assertAdmin → 聚合。 */
export const getAdminStatsFn = createServerFn({ method: 'GET' }).handler(async (): Promise<AdminStats> => {
  await assertAdmin()
  return getAdminStats(createDb(env.DB), Date.now())
})

/** server fn: assertAdmin → list waitlist entries paginated. */
export const getWaitlistFn = createServerFn({ method: 'GET' })
  .validator((d: { page?: number; pageSize?: number }) => ({ page: clampPage(d?.page), pageSize: clampPageSize(d?.pageSize) }))
  .handler(async ({ data }): Promise<{ rows: WaitlistRow[]; total: number }> => {
    await assertAdmin()
    return getWaitlist(createDb(env.DB), data)
  })

/** server fn: assertAdmin → list users (email/name search). */
export const getAdminUsersFn = createServerFn({ method: 'GET' })
  .validator((d: Partial<AdminUsersParams>) => ({
    q: typeof d?.q === 'string' ? d.q.slice(0, 200) : undefined,
    page: clampPage(d?.page),
    pageSize: clampPageSize(d?.pageSize),
    sortBy: typeof d?.sortBy === 'string' ? d.sortBy : 'createdAt', // getAdminUsers 内部再按白名单回退
    sortDir: clampSortDir(d?.sortDir),
  }))
  .handler(async ({ data }): Promise<{ rows: AdminUserRow[]; total: number }> => {
    await assertAdmin()
    return getAdminUsers(createDb(env.DB), data)
  })

/** server fn: assertAdmin → 反馈治理列表（含提交人与 Pro 徽章派生）。 */
export const getFeedbackFn = createServerFn({ method: 'GET' })
  .validator((d: { page?: number; pageSize?: number }) => ({ page: clampPage(d?.page), pageSize: clampPageSize(d?.pageSize) }))
  .handler(async ({ data }): Promise<{ rows: AdminFeedbackRow[]; total: number }> => {
    await assertAdmin()
    return listFeedbackForAdmin(createDb(env.DB), data)
  })

/** server fn: assertAdmin → 项目询盘列表（分页，可按 tier 过滤 + 关键词搜索）。 */
export const getInquiriesFn = createServerFn({ method: 'GET' })
  .validator((d: { page?: number; pageSize?: number; tier?: string; q?: string }): { page: number; pageSize: number; tier: InquiryTier | ''; q?: string } => {
    const tierIn = typeof d?.tier === 'string' ? d.tier : ''
    return {
      page: clampPage(d?.page),
      pageSize: clampPageSize(d?.pageSize),
      tier: TIERS.includes(tierIn as InquiryTier) ? (tierIn as InquiryTier) : '',
      q: typeof d?.q === 'string' && d.q.trim() ? d.q.trim().slice(0, 200) : undefined,
    }
  })
  .handler(async ({ data }): Promise<{ rows: InquiryRow[]; total: number }> => {
    await assertAdmin()
    return listInquiries(createDb(env.DB), data)
  })

/** server fn: assertAdmin → 询盘状态流转。 */
export const setInquiryStatusFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; status: InquiryStatus }) => ({
    id: typeof d?.id === 'string' ? d.id : '',
    status: STATUSES.includes(d?.status as InquiryStatus) ? (d.status as InquiryStatus) : 'new',
  }))
  .handler(async ({ data }): Promise<void> => {
    await assertAdmin()
    await setInquiryStatus(createDb(env.DB), data.id, data.status)
  })

/** server fn: assertAdmin → 状态流转 + 可选一句话回复。 */
export const setFeedbackStatusFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; status: FeedbackStatus; adminNote?: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    await assertAdmin()
    await setFeedbackStatus(createDb(env.DB), data.id, data.status, data.adminNote ?? null, Date.now())
  })
