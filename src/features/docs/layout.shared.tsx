import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { SITE_NAME } from '@/config/site'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: `${SITE_NAME} 文档` },
    links: [{ text: '首页', url: '/' }],
  }
}
