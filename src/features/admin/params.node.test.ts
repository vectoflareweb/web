import { test, expect } from 'vitest'
import { clampPage, clampPageSize, clampSortDir } from './params'

// RPC 端点可被直接构造调用，路由层 validateSearch 管不到 server fn 本身——
// 负数/NaN/超大值必须在这里收口，否则 pageSize:-1 变成 SQLite LIMIT -1（全表导出）。
test('clampPage：负数/NaN/非数字 → 0，小数取整', () => {
  expect(clampPage(3)).toBe(3)
  expect(clampPage(2.9)).toBe(2)
  expect(clampPage(-1)).toBe(0)
  expect(clampPage(NaN)).toBe(0)
  expect(clampPage('7')).toBe(0)
  expect(clampPage(undefined)).toBe(0)
})

test('clampPageSize：限定 1..100，非法回退默认', () => {
  expect(clampPageSize(20)).toBe(20)
  expect(clampPageSize(-1)).toBe(1)
  expect(clampPageSize(0)).toBe(1)
  expect(clampPageSize(10_000)).toBe(100)
  expect(clampPageSize(undefined)).toBe(20)
  expect(clampPageSize(Infinity)).toBe(20)
})

test('clampSortDir：只认 asc，其余一律 desc', () => {
  expect(clampSortDir('asc')).toBe('asc')
  expect(clampSortDir('desc')).toBe('desc')
  expect(clampSortDir('DROP TABLE')).toBe('desc')
  expect(clampSortDir(undefined)).toBe('desc')
})
