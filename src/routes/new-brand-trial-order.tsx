import { createFileRoute } from '@tanstack/react-router'
import { contentSingleRoute } from '@/features/content/content-single-route'

export const Route = createFileRoute('/new-brand-trial-order')({
  ...contentSingleRoute('/new-brand-trial-order'),
})