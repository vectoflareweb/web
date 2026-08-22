import { test, expect } from 'vitest'
import { clampSource } from './source'

test('defaults everything to waitlist', () => {
  expect(clampSource('waitlist')).toBe('waitlist')
  expect(clampSource('pricing')).toBe('waitlist')
  expect(clampSource(undefined)).toBe('waitlist')
  expect(clampSource('evil"; DROP TABLE')).toBe('waitlist')
})
