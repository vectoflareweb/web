/**
 * Convert a chosen ban-expiry Date into better-auth's `banExpiresIn` (seconds
 * from now). `undefined` expiry means a permanent ban (omit the field).
 *
 * The calendar hands us local midnight of the selected day; "ban until X"
 * means banned THROUGH X, so the ban runs to that day's 23:59:59.999 local.
 * Without this, selecting today produced a negative duration — a ban that
 * was already expired at creation while the UI still showed "Banned".
 */
export function banExpiresInSeconds(expiry: Date | undefined, now: number): number | undefined {
  if (!expiry) return undefined
  const end = new Date(expiry)
  end.setHours(23, 59, 59, 999)
  return Math.floor((end.getTime() - now) / 1000)
}
