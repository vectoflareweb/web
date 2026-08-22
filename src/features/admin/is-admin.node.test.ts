import { test, expect } from 'vitest'
import { isAdminEmail } from '@/features/admin/is-admin'

test('matches configured email (case-insensitive, trimmed)', () => {
  expect(isAdminEmail('Admin@Example.com', 'admin@example.com, b@x.com')).toBe(true)
  expect(isAdminEmail('  b@x.com ', 'admin@example.com,b@x.com')).toBe(true)
})
test('non-listed → false; empty/undefined env → false', () => {
  expect(isAdminEmail('nope@x.com', 'admin@example.com')).toBe(false)
  expect(isAdminEmail('a@x.com', '')).toBe(false)
  expect(isAdminEmail('a@x.com', undefined)).toBe(false)
})
