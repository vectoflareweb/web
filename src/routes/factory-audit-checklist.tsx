import { createFileRoute } from '@tanstack/react-router'
import { contentSingleRoute } from '@/features/content/content-single-route'

export const Route = createFileRoute('/factory-audit-checklist')({
  ...contentSingleRoute('/factory-audit-checklist'),
})
