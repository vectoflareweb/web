/**
 * Stylized top-view SUP board illustration used across the marketing site as
 * a stand-in for product photography (hero mockup, product cards, gallery,
 * customizer preview). Colors track the theme tokens so it adapts to
 * light/dark; `hue` tints the brand accents per product/project.
 */
export function BoardArt({
  hue = 195,
  label,
  ariaLabel = 'SUP board',
  className,
}: {
  hue?: number
  label?: string
  ariaLabel?: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 460 150" className={className} role="img" aria-label={ariaLabel} fill="none">
      {/* water ripples */}
      <g stroke="var(--primary)" strokeWidth="2" strokeLinecap="round">
        <path d="M16 138c13-7 26-7 39 0s26 7 39 0 26-7 39 0" opacity="0.28" />
        <path d="M318 138c13-7 26-7 39 0s26 7 39 0" opacity="0.2" />
        <path d="M120 8c13-7 26-7 39 0s26 7 39 0" opacity="0.14" />
      </g>
      {/* fin */}
      <path d="M404 26c11 7 14 17 14 17l-14 9z" fill="var(--border-strong)" opacity="0.85" />
      {/* board silhouette */}
      <path
        d="M10 75C10 52 26 34 48 28c28-8 72-10 132-10 80 0 150 6 200 16 36 8 68 24 68 41 0 17-32 33-68 41-50 10-120 16-200 16-60 0-104-2-132-10-22-6-38-24-38-47Z"
        fill="var(--card)"
        stroke="var(--border-strong)"
        strokeWidth="2"
      />
      {/* nose accent stripe */}
      <path
        d="M56 42 74 34.5 74 44 56 51.5Z"
        fill={`hsl(${hue} 72% 52%)`}
        opacity="0.9"
      />
      {/* deck pad */}
      <rect x="120" y="64" width="222" height="22" rx="11" fill="var(--soft)" stroke="var(--border-strong)" strokeOpacity="0.55" />
      {/* logo zone */}
      <rect x="152" y="68" width="158" height="14" rx="7" fill="var(--card-2)" stroke={`hsl(${hue} 72% 52%)`} strokeOpacity="0.45" strokeDasharray="3 3" />
      <text
        x="231"
        y="78.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="9.5"
        fontWeight="700"
        fill="var(--fg-3)"
        letterSpacing="0.08em"
      >
        {label ?? 'YOUR LOGO'}
      </text>
      {/* tail pinline */}
      <path d="M398 52c20 9 32 22 32 23" stroke={`hsl(${hue} 72% 52%)`} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}
