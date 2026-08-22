import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Per-request CSP nonce, propagated through the SSR render (and into the
 * Response headers) via AsyncLocalStorage. Workerd ships nodejs_compat, so
 * this works identically on the local vite dev server and in production.
 * A module-global would race once responses stream; ALS is request-scoped.
 *
 * `node:async_hooks` is a server primitive. TanStack re-bundles this module
 * into the client graph (script tags, router), where AsyncLocalStorage does
 * not exist — so guard the constructor and degrade to no-op there (the client
 * never issues its own CSP, nonce is read-only from the SSR'd HTML).
 */
const AsyncLocalStorageImpl =
  typeof AsyncLocalStorage === 'function' ? AsyncLocalStorage : null

const nonceStore = AsyncLocalStorageImpl ? new AsyncLocalStorageImpl<string>() : null

/** Generate a fresh nonce for this request and run `fn` inside its scope. */
export function runWithNonce<T>(fn: () => T | Promise<T>): Promise<T> {
  if (!nonceStore) return Promise.resolve(fn())
  return Promise.resolve(nonceStore.run(crypto.randomUUID(), fn))
}

/** Read the current request's nonce (SSR components / header middleware). */
export function getNonce(): string | undefined {
  return nonceStore?.getStore()
}
