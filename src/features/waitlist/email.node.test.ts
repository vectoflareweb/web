import { test, expect } from 'vitest'
import { normalizeEmail, isValidEmail } from './email'

test('normalizeEmail trims + lowercases', () => {
  expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com')
})

test('isValidEmail accepts a normal address', () => {
  expect(isValidEmail('foo@bar.com')).toBe(true)
})

test('isValidEmail rejects junk', () => {
  expect(isValidEmail('nope')).toBe(false)
  expect(isValidEmail('a@b')).toBe(false)
  expect(isValidEmail('')).toBe(false)
})
