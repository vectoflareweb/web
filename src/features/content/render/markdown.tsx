import React, { useMemo } from 'react'

/**
 * Minimal markdown renderer for vectoflare article bodies (products, news,
 * technology, case studies). The source content is first-party and uses a
 * small, regular subset: #/##/### headings, paragraphs, `-` and `1.` lists,
 * blockquotes, `---` rules, plus inline **bold**, `code` and [links](url).
 *
 * Content is trusted (our own marketing copy) — no sanitization needed.
 */

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(INLINE_RE)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${keyBase}-${i}`} className="rounded bg-bg-alt px-1.5 py-0.5 text-[0.9em] font-semibold">
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const href = link[2]
      const isExternal = href.startsWith('http')
      return (
        <a key={`${keyBase}-${i}`} href={href} className="font-semibold text-primary underline-offset-4 hover:underline" {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {link[1]}
        </a>
      )
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>
  })
}

interface Block {
  kind: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'quote' | 'hr'
  lines: string[]
}

function splitBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const raw = text.replace(/\r\n/g, '\n').trim()
  for (const chunk of raw.split(/\n{2,}/)) {
    const lines = chunk.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) continue
    const first = lines[0]
    if (first.startsWith('---') && lines.length === 1) {
      blocks.push({ kind: 'hr', lines })
    } else if (first.startsWith('###')) {
      blocks.push({ kind: 'h3', lines })
    } else if (first.startsWith('##')) {
      blocks.push({ kind: 'h2', lines })
    } else if (first.startsWith('# ')) {
      blocks.push({ kind: 'h1', lines })
    } else if (/^[-*]\s/.test(first) && lines.every((l) => /^[-*]\s/.test(l.trimStart()))) {
      blocks.push({ kind: 'ul', lines })
    } else if (/^\d+\.\s/.test(first) && lines.every((l) => /^\d+\.\s/.test(l.trimStart()))) {
      blocks.push({ kind: 'ol', lines })
    } else if (first.startsWith('>')) {
      blocks.push({ kind: 'quote', lines })
    } else {
      blocks.push({ kind: 'p', lines })
    }
  }
  return blocks
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => splitBlocks(text), [text])
  let li = 0
  return (
    <div className={className ?? ''}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h1':
            return <h2 key={i} className="mt-10 font-display text-3xl font-extrabold tracking-tight">{b.lines[0].replace(/^#\s*/, '')}</h2>
          case 'h2':
            return <h2 key={i} className="mt-10 font-display text-2xl font-extrabold tracking-tight">{b.lines[0].replace(/^##\s*/, '')}</h2>
          case 'h3':
            return <h3 key={i} className="mt-8 font-display text-xl font-bold tracking-tight">{b.lines[0].replace(/^###\s*/, '')}</h3>
          case 'hr':
            return <hr key={i} className="my-10 border-border" />
          case 'p':
            return (
              <p key={i} className="mt-5 text-[15px] leading-relaxed text-fg-2">
                {renderInline(b.lines.join(' '), `p${i}`)}
              </p>
            )
          case 'quote':
            return (
              <blockquote key={i} className="mt-5 border-l-4 border-primary/50 pl-4 text-[15px] italic leading-relaxed text-fg-2">
                {b.lines.map((l, j) => (
                  <React.Fragment key={j}>
                    {renderInline(l.replace(/^>\s?/, ''), `q${i}-${j}`)}
                    {j < b.lines.length - 1 ? <br /> : null}
                  </React.Fragment>
                ))}
              </blockquote>
            )
          case 'ul':
          case 'ol': {
            const Tag = b.kind === 'ul' ? 'ul' : 'ol'
            return (
              <Tag key={i} className={`mt-5 space-y-2 ${b.kind === 'ol' ? 'list-decimal' : 'list-disc'} pl-6 text-[15px] leading-relaxed text-fg-2 marker:text-primary`}>
                {b.lines.map((l) => (
                  <li key={`${i}-${li++}`}>{renderInline(l.replace(/^(\d+\.|\s*[-*])\s*/, ''), `li${i}-${li}`)}</li>
                ))}
              </Tag>
            )
          }
        }
      })}
    </div>
  )
}
