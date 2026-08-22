/** Shared section header: kicker + title + optional sub, centered. */
export function SectionHead({
  kicker,
  title,
  sub,
  className,
}: {
  kicker: string
  title: string
  sub?: string
  className?: string
}) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className ?? ''}`}>
      <p className="kicker">{kicker}</p>
      <h2 className="mt-3 font-display text-2xl font-extrabold leading-[1.12] tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-[15.5px] leading-relaxed text-fg-2">{sub}</p>}
      <span className="mx-auto mt-6 block h-1 w-14 rounded-full bg-gradient-to-r from-primary via-aqua to-sun" aria-hidden="true" />
    </div>
  )
}

/** Subpage hero band (non-home pages): kicker + title + sub on the ocean gradient. */
export function PageHero({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string
  title: string
  sub?: string
  children?: React.ReactNode
}) {
  return (
    <section className="ocean-grad relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-8 lg:px-10 md:pb-20 md:pt-20">
        <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#aee3f7]">{kicker}</p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
          {title}
        </h1>
        {sub && <p className="fg-dim mt-5 max-w-2xl text-[16px] leading-relaxed md:text-[17px]">{sub}</p>}
        {children}
      </div>
      {/* subtle wave divider */}
      <svg className="absolute -bottom-px left-0 w-full text-[var(--background)]" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 48h1440V24c-180 18-360 18-540 0S540 6 720 6s360 12 540 24v18H0Z" fill="currentColor" opacity="0.9" />
      </svg>
    </section>
  )
}
