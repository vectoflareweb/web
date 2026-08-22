import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

/** 用户侧 server fns。内部鉴权用 readUser 直调（handler 里调 requireUser 会双跳 RPC）；
 *  页面本身由 loader 的 requireUser 门控，这里的鉴权只是纵深防御。
 *  未登录抛 login redirect 而非 Error：loader 里与 requireUser 一起 Promise.all，谁先 reject 谁定跳转，
 *  必须保证这里也是 redirect，否则可能被 Error 抢跑命中错误边界而不是登录页。 */
async function currentUser() {
  const { readUser } = await import('@/features/auth/readUser.server')
  const user = await readUser()
  if (!user) throw redirect({ to: '/{-$locale}/login' })
  return user
}

export const getMyFeedbackFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { scopeFromUser } = await import('@/db/scope')
  const { listMyFeedback } = await import('./feedback.server')
  const user = await currentUser()
  return listMyFeedback(createDb(env.DB), scopeFromUser(user.id))
})

export const submitFeedbackFn = createServerFn({ method: 'POST' })
  .validator((d: { title: string; body?: string }) => d)
  .handler(async ({ data }) => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { scopeFromUser } = await import('@/db/scope')
    const { createFeedback } = await import('./feedback.server')
    const user = await currentUser()
    return createFeedback(createDb(env.DB), scopeFromUser(user.id), { title: data.title, body: data.body ?? '' }, Date.now())
  })

export const deleteFeedbackFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ deleted: boolean }> => {
    const { createDb } = await import('@/db/client')
    const { env } = await import('@/lib/env')
    const { scopeFromUser } = await import('@/db/scope')
    const { deleteMyFeedback } = await import('./feedback.server')
    const user = await currentUser()
    return { deleted: await deleteMyFeedback(createDb(env.DB), scopeFromUser(user.id), data.id) }
  })
