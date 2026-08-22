import { source } from './source'

/**
 * LLM-friendly plain-Markdown views of the docs.
 *
 * fumadocs' `getText()` can't run here — `'raw'` reads the filesystem (workerd
 * has none) and `'processed'` needs `_markdown` baked in, which this
 * fumadocs-mdx + TanStack setup doesn't emit. So we bundle the raw `.mdx` at
 * build time via a `?raw` glob and strip the frontmatter ourselves.
 */
const rawModules = import.meta.glob('/src/content/docs/**/*.{md,mdx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function rawFor(path: string): string | null {
  const hit = Object.entries(rawModules).find(([k]) => k.endsWith(`content/docs/${path}`))
  return hit ? hit[1] : null
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/, '').trim()
}

type DocPage = NonNullable<ReturnType<typeof source.getPage>>

/** `# {title} ({url})\n\n{body}` for one page — the shape LLMs expect. */
export function getLLMText(page: DocPage): string | null {
  const raw = rawFor(page.path)
  if (raw == null) return null
  return `# ${page.data.title} (${page.url})\n\n${stripFrontmatter(raw)}`
}

/** Raw markdown of one page by its source path (e.g. "features/auth.mdx"). */
export function getLLMTextByPath(path: string): string | null {
  const page = source.getPages().find((p) => p.path === path)
  return page ? getLLMText(page) : null
}

/** All pages concatenated — the body of `/llms-full.txt`. */
export function getLLMFullText(): string {
  return source
    .getPages()
    .map((p) => getLLMText(p))
    .filter((t): t is string => t != null)
    .join('\n\n')
}
