import { createFileRoute } from '@tanstack/react-router'
import { contentSingleRoute } from '@/features/content/content-single-route'

export const Route = createFileRoute('/oem-odm-private-label-comparison')({
  ...contentSingleRoute('/oem-odm-private-label-comparison'),
})
