import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { NotFound } from './components/not-found'
import { ErrorPage } from './components/error-boundary'
import { getNonce } from '@/lib/csp'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // One-minute stale window so repeated hovers on the same link don't refetch
    // the preloaded route (marketing pages change rarely).
    defaultPreloadStaleTime: 60_000,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ErrorPage,
    // <Scripts /> (and inline route scripts) pick up the request-scoped CSP
    // nonce from here; undefined in dev, where no CSP is enforced.
    ssr: { nonce: getNonce() },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
