/**
 * Shared text extraction helpers for indexing pipelines (AI corpus + site
 * search). Kept framework-free and side-effect-free for node testing.
 */

/** Strip markdown to plain text (headings, links, lists, emphasis, tables…). */
export function mdToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1$2')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Deep-walk a YAML page's `content` record into one text blob (all sections). */
export function pageText(content: Record<string, unknown>): string {
  const parts: string[] = []
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      const s = v.trim()
      if (s.length > 2 && !/^(https?:\/\/|\/)/.test(s) && !/\.(jpe?g|png|webp|svg|avif|pdf)$/i.test(s)) {
        parts.push(s)
      }
    } else if (Array.isArray(v)) {
      for (const item of v) walk(item)
    } else if (v && typeof v === 'object') {
      for (const val of Object.values(v)) walk(val)
    }
  }
  for (const [key, value] of Object.entries(content)) {
    if (key === 'meta' || key === 'cta') continue
    walk(value)
  }
  return parts.join('\n')
}

/** Split a body into ~maxChars paragraph-grouped pieces (stable part ids). */
export function chunkBody(body: string, maxChars = 1800): string[] {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => mdToText(p))
    .map((p) => p.trim())
    .filter((p) => p.length > 20)
  const out: string[] = []
  let buf = ''
  for (const p of paragraphs) {
    if (buf && buf.length + p.length + 1 > maxChars) {
      out.push(buf)
      buf = ''
    }
    buf = buf ? `${buf} ${p}` : p
  }
  if (buf) out.push(buf)
  return out
}
