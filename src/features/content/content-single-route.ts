import { ErrorComponent } from '@tanstack/react-router'
import { OG_IMAGE } from '@/features/seo/seo'
import { SITE_NAME } from '@/config/site'
import { OG_LOCALE } from '@/config/locales'
import type { CatchAllData } from './catchall'

export function contentSingleRoute(path: string) {
  return {
    errorComponent: ErrorComponent,
    loader: async (): Promise<CatchAllData> => {
      const { contentServerLoader } = await import('./catchall')
      return contentServerLoader({ data: { path, locale: 'en' } })
    },
    head: ({ loaderData }: { loaderData?: CatchAllData }) => {
      if (!loaderData) return {}
      const { origin, title, description } = loaderData
      const canonical = `${origin}${path}`
      const image = loaderData.kind === 'page' ? OG_IMAGE : ((loaderData as { image?: string }).image ?? OG_IMAGE)
      const absImage = (image.startsWith('http') ? image : `${origin}${image}`).replace(/\.avif$/, '.jpg')
      const links: { rel: string; href: string; hreflang?: string }[] = [{ rel: 'canonical', href: canonical }]
      links.push({ rel: 'alternate', hreflang: 'en-US', href: canonical })
      links.push({ rel: 'alternate', hreflang: 'x-default', href: canonical })
      if (loaderData.esTranslated) {
        links.push({ rel: 'alternate', hreflang: 'es-ES', href: `${origin}/es${path}` })
      }
      return {
        meta: [
          { title },
          { name: 'description', content: description },
          { property: 'og:site_name', content: SITE_NAME },
          { property: 'og:title', content: title },
          { property: 'og:description', content: description },
          { property: 'og:url', content: canonical },
          { property: 'og:locale', content: OG_LOCALE.en },
          { property: 'og:locale:alternate', content: OG_LOCALE.es },
          { property: 'og:type', content: loaderData.kind === 'post' || loaderData.kind === 'article' ? 'article' : 'website' },
          { property: 'og:image', content: absImage },
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '630' },
          { property: 'og:image:type', content: absImage.endsWith('.webp') ? 'image/webp' : 'image/jpeg' },
          { property: 'og:image:alt', content: `${SITE_NAME} — ${title.replace(/\s+\|.*$/, '')}` },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:site', content: '@myproduct' },
          { name: 'twitter:title', content: title },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: absImage },
          { name: 'twitter:image:alt', content: `${SITE_NAME} — ${title.replace(/\s+\|.*$/, '')}` },
        ],
        links,
      }
    },
  }
}
