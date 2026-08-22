import { SITE_NAME, SITE_DOMAIN } from './site'
import { PRODUCT_BOILERPLATE, PRODUCT_BUILD_LINE, PRODUCT_NOT_ROB, PRODUCT_OG_IMAGE_FILENAME } from '@/product/brand-constants'

export const BRAND_LOGO_URL = '/logo192.png' as const

export const BRAND_FAVICON_ICO = '/favicon.ico' as const
export const BRAND_FAVICON_SVG = '/favicon.svg' as const

export const BRAND_OG_IMAGE = `https://assets.${SITE_DOMAIN}/images/products/${PRODUCT_OG_IMAGE_FILENAME}.webp` as const
export const BRAND_HERO_IMAGE = `https://assets.${SITE_DOMAIN}/images/products/${PRODUCT_OG_IMAGE_FILENAME}.avif` as const
export const BRAND_HERO_IMAGE_768 = `https://assets.${SITE_DOMAIN}/images/products/${PRODUCT_OG_IMAGE_FILENAME}-768.avif` as const
export const BRAND_HERO_IMAGE_480 = `https://assets.${SITE_DOMAIN}/images/products/${PRODUCT_OG_IMAGE_FILENAME}-480.avif` as const
export const BRAND_HERO_IMAGE_WEBP = `https://assets.${SITE_DOMAIN}/images/products/${PRODUCT_OG_IMAGE_FILENAME}.webp` as const

export const BRAND_ASSETS_CDN = `https://assets.${SITE_DOMAIN}` as const

export const BRAND_SOCIAL = {
  facebook: 'https://www.facebook.com/myproduct',
  linkedin: 'https://www.linkedin.com/company/myproduct',
  youtube: 'https://www.youtube.com/@myproduct',
} as const

export const BRAND_CONTACT = {
  email: 'info@myproduct.com',
  whatsapp: '',
  whatsappLink: '',
  address: '',
} as const

export const BRAND_BOILERPLATE = PRODUCT_BOILERPLATE as typeof PRODUCT_BOILERPLATE

export const BRAND_BUILD_LINE = PRODUCT_BUILD_LINE as typeof PRODUCT_BUILD_LINE

export const BRAND_NOT_ROB = PRODUCT_NOT_ROB as typeof PRODUCT_NOT_ROB

export const BRAND_COMPANY_NAME = 'MyCompany Inc.' as const
export const BRAND_PARENT_BRAND = '' as const
export const BRAND_PARENT_DOMAIN = '' as const
export const BRAND_PARENT_URL = `https://${BRAND_PARENT_DOMAIN}` as const
