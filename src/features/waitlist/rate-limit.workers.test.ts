import { test, expect } from 'vitest'
import { env } from 'cloudflare:test'
import { fixedWindowLimit } from './rate-limit'

const WINDOW = 600 // 10 min

test('allows up to the limit within a window, then blocks', async () => {
  const key = `ip-${crypto.randomUUID()}`
  const now = Date.now()
  for (let i = 0; i < 3; i++) {
    expect(await fixedWindowLimit(env.CACHE, key, 3, WINDOW, now)).toBe(true)
  }
  expect(await fixedWindowLimit(env.CACHE, key, 3, WINDOW, now)).toBe(false)
})

test('a new window resets the budget', async () => {
  const key = `ip-${crypto.randomUUID()}`
  const now = Date.now()
  for (let i = 0; i < 3; i++) await fixedWindowLimit(env.CACHE, key, 3, WINDOW, now)
  expect(await fixedWindowLimit(env.CACHE, key, 3, WINDOW, now)).toBe(false)
  expect(await fixedWindowLimit(env.CACHE, key, 3, WINDOW, now + WINDOW * 1000)).toBe(true)
})

test('keys are independent', async () => {
  const a = `ip-${crypto.randomUUID()}`
  const b = `ip-${crypto.randomUUID()}`
  const now = Date.now()
  for (let i = 0; i < 3; i++) await fixedWindowLimit(env.CACHE, a, 3, WINDOW, now)
  expect(await fixedWindowLimit(env.CACHE, a, 3, WINDOW, now)).toBe(false)
  expect(await fixedWindowLimit(env.CACHE, b, 3, WINDOW, now)).toBe(true)
})
