/**
 * Pure RAG core for the AI sales assistant (POST /api/ask).
 *
 * Deliberately free of Cloudflare bindings and the content loader so it stays
 * node-testable and cheap to import on the hot path — the loader is pulled in
 * lazily only where the data is actually needed (faq fallback / index build).
 */

import { SITE_NAME, SITE_URL } from '@/config/site'
import { AI_SYSTEM_ROLE, AI_INQUIRY_PROMPT, AI_DISCLOSURE } from '@/product/ai-content'

export interface AiChunk {
  id: string
  text: string
  url: string
  title: string
}

export interface AskSource {
  title: string
  url: string
}

export interface AskMessage {
  role: 'user' | 'assistant'
  content: string
}

/** FNV-1a 32-bit — deterministic, stable across restarts (ids key vector upserts). */
export function stableHash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** Generate a URL-safe slug from a question for anchor links. */
export function faqSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const squeeze = (s: string): string => s.replace(/\s+/g, ' ').trim()

/** Build a single index chunk; drops empty text, caps length (bge-m3 context). */
export function makeChunk(url: string, title: string, text: string, id: string): AiChunk | null {
  const t = squeeze(text)
  if (!t) return null
  return { id, url, title: squeeze(title), text: t.slice(0, 3000) }
}

export interface AskPromptInput {
  question: string
  history?: AskMessage[]
  chunks: Pick<AiChunk, 'text' | 'url' | 'title'>[]
}

/**
 * Assemble the system + user messages for the answer generator.
 * Chunks are numbered [n] so the model can cite its sources.
 */
export function buildAskPrompt(input: AskPromptInput): { system: string; user: string } {
  const { question, chunks } = input
  const history = (input.history ?? []).slice(-6)
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.title}\nSource: ${c.url}\n${c.text}`)
    .join('\n\n')
  const system = [
    AI_SYSTEM_ROLE.replaceAll('{SITE}', SITE_NAME),
    'Answer the buyer using ONLY the knowledge base below. Cite the relevant sources as [1], [2] after every factual claim.',
    'Never invent prices, MOQ, lead times, certifications, materials or delivery conditions — if a fact is not in the knowledge base, do not guess it.',
    'For pricing, certification scope, or project-specific MOQ/lead-time questions, always add: "These details are project-confirmed. Request a quote for your specific requirements."',
    AI_DISCLOSURE,
    AI_INQUIRY_PROMPT.replaceAll('{SITE_URL}', SITE_URL),
    'Answer in the same language as the buyer\'s question (English or Spanish). Be concise and helpful: state the answer first, then 2-5 short bullets of supporting detail.',
    '',
    'Knowledge base:',
    context,
  ].join('\n')
  const historyBlock = history
    .map((m) => `${m.role === 'user' ? 'Buyer' : 'Assistant'}: ${m.content}`)
    .join('\n')
  const user = [historyBlock && `Previous conversation:\n${historyBlock}`, `Buyer: ${question}`]
    .filter(Boolean)
    .join('\n\n')
  return { system, user }
}

const CJK_CHAR = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u

const CJK_KEYWORDS: ReadonlyArray<{ cjk: readonly string[]; en: readonly string[] }> = [
  { cjk: ['工厂', '厂', '制造'], en: ['factory', 'plant', 'manufacturing'] },
  { cjk: ['地址', '位置', '在哪', '位于'], en: ['address', 'location', 'located', 'where'] },
  { cjk: ['价格', '多少钱', '报价'], en: ['price', 'cost', 'quote', 'pricing'] },
  { cjk: ['最低', '起订', '数量'], en: ['minimum', 'moq', 'quantity', 'order'] },
  { cjk: ['认证', '证书', '资质'], en: ['certification', 'certified', 'ce', 'bsci'] },
  { cjk: ['交货', '发货', '运输', '物流'], en: ['delivery', 'shipping', 'lead time', 'logistics', 'freight'] },
  { cjk: ['样品', '样本', '打样'], en: ['sample', 'prototype', 'sampling'] },
  { cjk: ['材料', '材质', '面料'], en: ['material', 'pvc', 'fabric', 'drop stitch'] },
  { cjk: ['包装', '标签', '品牌'], en: ['packaging', 'label', 'branding', 'private label'] },
  { cjk: ['质量', '质检', '检验', '检测'], en: ['quality', 'inspection', 'qc', 'test'] },
  { cjk: ['保修', '售后', '投诉'], en: ['warranty', 'claim', 'defect'] },
  { cjk: ['定制', '自定义', 'oem', 'odm'], en: ['custom', 'oem', 'odm', 'customize'] },
  { cjk: ['充气', '气密', '漏气'], en: ['inflatable', 'air', 'pressure', 'leak'] },
]

function expandCjkToEn(question: string): string {
  if (!CJK_CHAR.test(question)) return question
  const lower = question.toLowerCase()
  const extra: string[] = []
  for (const map of CJK_KEYWORDS) {
    if (map.cjk.some((kw) => lower.includes(kw.toLowerCase()))) {
      extra.push(...map.en)
    }
  }
  return extra.length ? `${question} ${extra.join(' ')}` : question
}

function tokenizeForMatch(text: string): string[] {
  const norm = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  if (!norm) return []
  const tokens: string[] = []
  for (const segment of norm.split(' ')) {
    if (!segment) continue
    let buf = ''
    for (const ch of segment) {
      if (CJK_CHAR.test(ch)) {
        if (buf) { tokens.push(buf); buf = '' }
        tokens.push(ch)
      } else {
        buf += ch
      }
    }
    if (buf) tokens.push(buf)
  }
  return tokens
}

export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const MIN_MATCH_SCORE = 0.55
const MIN_MATCH_SCORE_CJK = 0.30

export function matchFaq(
  question: string,
  faqs: { q: string; a: string }[],
): { answer: string; faq: { q: string; a: string } } | null {
  const expanded = expandCjkToEn(question)
  const rawTokens = tokenizeForMatch(expanded).filter((w) => w.length > 1 || CJK_CHAR.test(w))
  if (rawTokens.length < 2) return null
  const isCjkQuestion = rawTokens.some((t) => CJK_CHAR.test(t))
  const scoredTokens = isCjkQuestion
    ? rawTokens.filter((t) => !CJK_CHAR.test(t))
    : rawTokens
  if (scoredTokens.length < 2) return null
  const qSet = new Set(scoredTokens)
  const threshold = isCjkQuestion ? MIN_MATCH_SCORE_CJK : MIN_MATCH_SCORE
  let best: { score: number; faq: { q: string; a: string } } | null = null
  for (const faq of faqs) {
    const hay = normalizeQuestion(`${faq.q} ${faq.a}`)
    const hayWords = new Set(tokenizeForMatch(`${faq.q} ${faq.a}`))
    let hits = 0
    for (const t of qSet) {
      if (hayWords.has(t) || hay.includes(t)) hits++
    }
    const score = hits / qSet.size
    if (score >= threshold && (!best || score > best.score)) best = { score, faq }
  }
  return best ? { answer: best.faq.a, faq: best.faq } : null
}

const CORPUS_MIN_SCORE = 0.35
const CORPUS_MIN_SCORE_CJK = 0.20

const STOP_WORDS = new Set([
  'what', 'where', 'when', 'how', 'who', 'which', 'why', 'whose',
  'does', 'do', 'did', 'is', 'are', 'was', 'were', 'be', 'been',
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
  'and', 'or', 'but', 'not', 'this', 'that', 'these', 'those',
  'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their',
  'have', 'has', 'had', 'can', 'could', 'will', 'would', 'should',
  'from', 'by', 'as', 'if', 'than', 'so', 'no', 'up', 'out',
  'about', 'into', 'over', 'after', 'also', 'just', 'very',
])

export function matchCorpus(
  question: string,
  chunks: readonly AiChunk[],
): { answer: string; chunk: AiChunk } | null {
  const expanded = expandCjkToEn(question)
  const rawTokens = tokenizeForMatch(expanded).filter((w) => w.length > 1 || CJK_CHAR.test(w))
  if (rawTokens.length < 2) return null
  const isCjkQuestion = rawTokens.some((t) => CJK_CHAR.test(t))
  const scoredTokens = isCjkQuestion
    ? rawTokens.filter((t) => !CJK_CHAR.test(t))
    : rawTokens.filter((t) => !STOP_WORDS.has(t))
  if (scoredTokens.length < 1) return null
  const qSet = new Set(scoredTokens)
  const threshold = isCjkQuestion ? CORPUS_MIN_SCORE_CJK : CORPUS_MIN_SCORE
  let best: { score: number; chunk: AiChunk } | null = null
  for (const chunk of chunks) {
    const hay = normalizeQuestion(`${chunk.title} ${chunk.text}`)
    const hayWords = new Set(tokenizeForMatch(`${chunk.title} ${chunk.text}`))
    let hits = 0
    for (const t of qSet) {
      if (hayWords.has(t) || hay.includes(t)) hits++
    }
    const score = hits / qSet.size
    if (score >= threshold && (!best || score > best.score)) best = { score, chunk }
  }
  return best ? { answer: best.chunk.text, chunk: best.chunk } : null
}
