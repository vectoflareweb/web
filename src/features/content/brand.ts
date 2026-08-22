import { SITE_NAME } from '@/config/site'
import { BRAND_PARENT_BRAND } from '@/config/branding'
import { REGION_COUNT_DEFAULT } from '@/product/ai-content'

let regionCount = REGION_COUNT_DEFAULT

export function setBrandCount(n: number): void {
  regionCount = n
}

export function brandify(text: string): string {
  return text.replaceAll('{SITE}', SITE_NAME).replaceAll('{BRAND}', BRAND_PARENT_BRAND).replaceAll('{count}', String(regionCount))
}
