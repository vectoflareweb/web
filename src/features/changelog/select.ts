export type ChangelogRaw = {
  info: { path: string }
  title: string
  description?: string
  date: string
  version: string
  published?: boolean
}

export type ChangelogMeta = {
  path: string
  title: string
  description?: string
  date: string
  version: string
}

/** Filter a fumadocs changelog collection by locale (.es filename), drop unpublished, sort newest first. */
export function selectChangelog(entries: ChangelogRaw[], locale: string): ChangelogMeta[] {
  const isDefault = locale === 'en'
  return entries
    .filter((e) => (isDefault ? !e.info.path.includes('.es') : e.info.path.includes(`.${locale}`)))
    .filter((e) => e.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => ({ path: e.info.path, title: e.title, description: e.description, date: e.date, version: e.version }))
}
