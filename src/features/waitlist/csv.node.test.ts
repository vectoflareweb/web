import { test, expect } from 'vitest'
import { toCsv } from './csv'

test('renders header + rows and escapes commas/quotes', () => {
  const csv = toCsv([
    { email: 'a@b.com', locale: 'en', source: 'waitlist', createdAt: new Date('2026-06-01T00:00:00Z') },
    { email: 'c@d.com', locale: 'es', source: 'a,b"c', createdAt: new Date('2026-06-02T00:00:00Z') },
  ])
  const lines = csv.trim().split('\n')
  expect(lines[0]).toBe('email,locale,source,created_at')
  expect(lines[1]).toContain('a@b.com,en,waitlist,2026-06-01T00:00:00.000Z')
  expect(lines[2]).toContain('"a,b""c"') // comma + quote escaped
})

test('公式前缀被中和（CSV 注入：管理员用 Excel 打开导出不执行公式）', () => {
  const csv = toCsv([
    { email: '=HYPERLINK("http://evil","x")@a.b', locale: 'en', source: '+1', createdAt: new Date('2026-06-01T00:00:00Z') },
  ])
  const line = csv.trim().split('\n')[1]
  expect(line).toContain(`'=HYPERLINK`) // 前置单引号——Excel 视为文本
  expect(line).toContain(`'+1`)
  expect(line).not.toMatch(/(^|,)=/) // 没有裸公式起始
})
