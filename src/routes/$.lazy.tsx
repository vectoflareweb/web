import { createLazyFileRoute } from '@tanstack/react-router'
import { ContentCatchAll } from '@/features/content/catchall'

export const Route = createLazyFileRoute('/$')({ component: CatchAll })

function CatchAll() {
  const data = Route.useLoaderData()
  if (!data) return null
  return <ContentCatchAll data={data} />
}
