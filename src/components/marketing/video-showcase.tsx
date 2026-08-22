import { useState } from 'react'
import { Play } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'

/**
 * Video showcase block — a factory/brand video paired with a step or point
 * list. Used on the home page (brand launch) and /how-it-works (production).
 *
 * The video is lazy: only the poster image loads initially; the media file is
 * fetched after the visitor clicks play (keeps multi-MB videos off the wire
 * for browsers that never press play).
 */
export function VideoShowcase({
  video,
  poster,
  badge,
  title,
  sub,
  points,
  flip = false,
  eagerPoster = false,
}: {
  video: string
  poster: string
  badge: string
  title: string
  sub: string
  points: { t: string; d?: string }[]
  flip?: boolean
  eagerPoster?: boolean
}) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <div className={`grid items-center gap-10 lg:grid-cols-2 ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        {playing ? (
          <video
            controls
            autoPlay
            playsInline
            poster={poster}
            aria-label={title}
            className="aspect-video w-full rounded-3xl border border-border-2 bg-bg-alt object-cover"
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={t('common.playVideo', { title })}
            className="group relative block aspect-video w-full overflow-hidden rounded-3xl border border-border-2 bg-bg-alt"
          >
            <img
              src={poster}
              alt={title}
              width={1600}
              height={900}
              loading={eagerPoster ? 'eager' : 'lazy'}
              fetchPriority={eagerPoster ? 'high' : 'auto'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-[var(--shadow-lg)] transition-transform duration-300 group-hover:scale-110">
                <Play fill="currentColor" size={26} aria-hidden="true" />
              </span>
            </span>
          </button>
        )}
        <div>
          <span className="pill self-start border-primary/25! bg-soft! text-primary!">{badge}</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight">{title}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-fg-2">{sub}</p>
          <ol className="mt-7 space-y-4">
            {points.map((p, i) => (
              <li key={p.t} className="flex gap-3.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[13px] font-extrabold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[15px] font-semibold">{p.t}</p>
                  {p.d && <p className="mt-0.5 text-[13.5px] leading-relaxed text-fg-2">{p.d}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
