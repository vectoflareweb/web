import { createFileRoute } from '@tanstack/react-router'
import { contentSingleRoute } from '@/features/content/content-single-route'

export const Route = createFileRoute('/b2b-solutions-matrix')({
  ...contentSingleRoute('/b2b-solutions-matrix'),
})
