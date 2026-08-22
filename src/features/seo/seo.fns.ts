import { createServerFn } from '@tanstack/react-start'

/** Returns the site origin (protocol + host) for use in SEO head tags. */
export const getOrigin = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string> => {
    // Lazy env import (repo convention): keeps cloudflare:workers out of node test graphs.
    const { env } = await import('@/lib/env')
    return new URL(env.BETTER_AUTH_URL).origin
  },
)
