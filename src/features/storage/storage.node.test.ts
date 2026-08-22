import { test, expect } from 'vitest'
import { validateAvatar, sniffImage, avatarObjectKey, MAX_AVATAR_BYTES } from './storage'

const bytes = (...v: number[]) => new Uint8Array(v)
const text = (s: string) => new TextEncoder().encode(s)

function png(): Uint8Array {
  return bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
}

test('sniffImage accepts real magic numbers and rejects lookalikes', () => {
  expect(sniffImage(png(), 'image/png')).toBe(true)
  expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg')).toBe(true)
  expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50), 'image/webp')).toBe(true)
  expect(sniffImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61), 'image/gif')).toBe(true)
  // Truncated / wrong bytes are rejected
  expect(sniffImage(bytes(0x89, 0x50), 'image/png')).toBe(false)
  expect(sniffImage(png(), 'image/jpeg')).toBe(false)
  expect(sniffImage(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'image/png')).toBe(false)
})

test('sniffImage handles svg text headers (BOM and whitespace tolerant)', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  expect(sniffImage(text(svg), 'image/svg+xml')).toBe(true)
  expect(sniffImage(text(`\uFEFF${svg}`), 'image/svg+xml')).toBe(true)
  expect(sniffImage(text(` \n${svg}`), 'image/svg+xml')).toBe(true)
  expect(sniffImage(text(`<?xml version="1.0"?>${svg}`), 'image/svg+xml')).toBe(true)
  expect(sniffImage(text('<!DOCTYPE html><html></html>'), 'image/svg+xml')).toBe(false)
  // HTML pretending to be an image must fail
  expect(sniffImage(text('<!DOCTYPE html><html></html>'), 'image/png')).toBe(false)
})

test('sniffImage rejects unknown declared types', () => {
  expect(sniffImage(png(), 'application/pdf')).toBe(false)
  expect(sniffImage(text('hello'), 'text/plain')).toBe(false)
})

test('avatarObjectKey is one stable key per user (re-upload overwrites)', () => {
  expect(avatarObjectKey('user-123')).toBe('avatars/user-123')
})

test('accepts an allowed type within the size limit', () => {
  expect(validateAvatar({ type: 'image/png', size: 1024 })).toEqual({ ok: true })
  expect(validateAvatar({ type: 'image/webp', size: MAX_AVATAR_BYTES })).toEqual({ ok: true })
})

test('rejects empty file', () => {
  expect(validateAvatar({ type: 'image/png', size: 0 })).toEqual({ ok: false, reason: 'empty' })
})

test('rejects unsupported type', () => {
  expect(validateAvatar({ type: 'application/pdf', size: 10 })).toEqual({ ok: false, reason: 'type' })
  expect(validateAvatar({ type: 'image/svg+xml', size: 10 })).toEqual({ ok: false, reason: 'type' })
})

test('rejects oversized file', () => {
  expect(validateAvatar({ type: 'image/jpeg', size: MAX_AVATAR_BYTES + 1 })).toEqual({
    ok: false,
    reason: 'size',
  })
})

test('size check runs only after type check (empty beats type beats size)', () => {
  // empty wins even with a bad type
  expect(validateAvatar({ type: 'application/pdf', size: 0 }).ok).toBe(false)
  expect(validateAvatar({ type: 'application/pdf', size: 0 })).toEqual({ ok: false, reason: 'empty' })
})
