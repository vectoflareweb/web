import { describe, test, expect } from 'vitest'
import { banExpiresInSeconds } from './ban'

describe('banExpiresInSeconds', () => {
  test('undefined expiry → undefined (permanent)', () => {
    expect(banExpiresInSeconds(undefined, 1_000_000)).toBeUndefined()
  })
  test('future date → seconds until the END of that day', () => {
    const now = Date.UTC(2026, 6, 1, 12, 0, 0)
    const expiry = new Date(now + 3 * 24 * 3600 * 1000)
    const end = new Date(expiry)
    end.setHours(23, 59, 59, 999)
    expect(banExpiresInSeconds(expiry, now)).toBe(Math.floor((end.getTime() - now) / 1000))
  })
  test('selecting today (local midnight) → positive duration through end of today', () => {
    const now = Date.now()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0) // what the calendar hands us for "today"
    const secs = banExpiresInSeconds(today, now)!
    expect(secs).toBeGreaterThan(0)
    expect(secs).toBeLessThanOrEqual(24 * 3600)
  })
})
