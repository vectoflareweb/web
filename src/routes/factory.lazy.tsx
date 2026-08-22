import { createLazyFileRoute } from '@tanstack/react-router'
import { ContentCatchAll } from '@/features/content/catchall'

export const Route = createLazyFileRoute('/factory')({ component: Page })

function Page() {
  const data = Route.useLoaderData()
  if (!data) return null
  return <ContentCatchAll data={data} />
}
