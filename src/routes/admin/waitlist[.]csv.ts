import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { assertAdmin } from '@/features/admin/assert-admin.server'
import { getWaitlist } from '@/features/waitlist/getWaitlist'
import { toCsv } from '@/features/waitlist/csv'

const handler = async () => {
  // 与 admin server fn 共用同一道门（fresh session + 撤权即降权）；自建的弱化判据
  // 会让被撤权的旧管理员继续导出全量邮箱。
  try {
    await assertAdmin()
  } catch {
    return new Response('Not Found', { status: 404 })
  }
  const { rows } = await getWaitlist(createDb(env.DB), { page: 0, pageSize: 100000 })
  return new Response(toCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="waitlist.csv"',
      'cache-control': 'no-store',
    },
  })
}

export const Route = createFileRoute('/admin/waitlist.csv')({
  server: { handlers: { GET: handler } },
})
