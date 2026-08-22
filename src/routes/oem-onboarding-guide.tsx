import { createFileRoute } from '@tanstack/react-router'
import { contentSingleRoute } from '@/features/content/content-single-route'

export const Route = createFileRoute('/oem-onboarding-guide')({
  ...contentSingleRoute('/oem-onboarding-guide'),
})
