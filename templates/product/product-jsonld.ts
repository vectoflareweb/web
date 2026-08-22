export const PRODUCT_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '{{site_name}}',
  description: '{{description}}',
  url: 'https://{{site_domain}}',
} as const
