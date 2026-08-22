import { test, expect } from 'vitest'
import { selectChangelog, type ChangelogRaw } from './select'

const raw: ChangelogRaw[] = [
  { info: { path: 'v1-0-0.md' }, title: 'Launch', date: '2026-06-01', version: 'v1.0.0' },
  { info: { path: 'v1-1-0.md' }, title: 'Update', date: '2026-06-24', version: 'v1.1.0' },
  { info: { path: 'v1-0-0.es.md' }, title: 'Primera versión', date: '2026-06-01', version: 'v1.0.0' },
  { info: { path: 'draft.md' }, title: 'Draft', date: '2026-12-01', version: 'v9.9.9', published: false },
]

test('en: non-.es files, newest first, drafts excluded', () => {
  expect(selectChangelog(raw, 'en').map((e) => e.version)).toEqual(['v1.1.0', 'v1.0.0'])
})

test('es: only .es files', () => {
  expect(selectChangelog(raw, 'es').map((e) => e.path)).toEqual(['v1-0-0.es.md'])
})

test('excludes published:false', () => {
  expect(selectChangelog(raw, 'en').some((e) => e.version === 'v9.9.9')).toBe(false)
})
