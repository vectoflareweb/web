import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from '@/features/auth/auth.schema'

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  status: text('status').notNull().default('open'), // FeedbackStatus
  adminNote: text('admin_note'),                    // 管理员可选回复，用户侧可见
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [
  // SQLite 不为外键自动建索引：没有它，按用户列表查询和删号级联（ON DELETE CASCADE
  // 的子表扫描）都是全表扫。
  index('feedback_userId_idx').on(t.userId),
])

export type Feedback = typeof feedback.$inferSelect
