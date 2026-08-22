import { authClient } from '@/features/auth/auth.client'
import type { ShellUser } from '@/components/app/app-shell'

export function useAdminUser(): ShellUser {
  const { data: session } = authClient.useSession()
  return {
    name: session?.user?.name,
    email: session?.user?.email ?? '',
    role: session?.user?.role ?? 'admin',
    image: session?.user?.image ?? null,
  }
}
