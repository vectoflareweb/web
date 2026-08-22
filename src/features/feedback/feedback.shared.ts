/** 客户端与服务端共享的纯常量——不要在这里 import 任何服务端模块。 */
export const FEEDBACK_STATUSES = ['open', 'planned', 'shipped', 'closed'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]
export const TITLE_MAX = 80
export const BODY_MAX = 2000
/** 每用户 open 状态的存量上限 —— 最简防滥用。 */
export const OPEN_LIMIT = 10
