export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

// Deliberately simple: format only (no MX / disposable checks).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}
