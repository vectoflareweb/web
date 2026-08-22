import { test, expect } from 'vitest'
import { addContactTo } from './audience'

test('skips when no resend client', async () => {
  expect(await addContactTo(null, 'aud_123', 'a@b.com')).toBe('skipped')
})

test('skips when no audience id', async () => {
  // a non-null placeholder client is never called because audienceId is null
  const fake = {} as Parameters<typeof addContactTo>[0]
  expect(await addContactTo(fake, null, 'a@b.com')).toBe('skipped')
})
