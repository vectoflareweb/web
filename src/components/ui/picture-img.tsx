import * as React from 'react'

interface PictureImgProps extends React.ComponentProps<'img'> {
  avif?: string
  webp?: string
  avifSrcSet?: string
  webpSrcSet?: string
}

export function PictureImg({ avif, webp, avifSrcSet, webpSrcSet, ...imgProps }: PictureImgProps) {
  return (
    <picture>
      {avifSrcSet && <source srcSet={avifSrcSet} type="image/avif" />}
      {avif && !avifSrcSet && <source srcSet={avif} type="image/avif" />}
      {webpSrcSet && <source srcSet={webpSrcSet} type="image/webp" />}
      {webp && !webpSrcSet && <source srcSet={webp} type="image/webp" />}
      <img {...imgProps} />
    </picture>
  )
}
