import { test, expect } from 'vitest'
import { verifyTurnstile } from './turnstile'

test('skips verification when no secret configured', async () => {
  expect(await verifyTurnstile('any-token', undefined)).toBe(true)
  expect(await verifyTurnstile('any-token', '')).toBe(true)
})

test('returns false when token is empty but secret is set', async () => {
  expect(await verifyTurnstile('', 'secret-123')).toBe(false)
})
