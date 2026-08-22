/** 解析逗号分隔的 ADMIN_EMAILS，判断 email 是否为管理员（trim + 大小写不敏感）。 */
export function isAdminEmail(email: string, adminEmailsRaw: string | undefined): boolean {
  if (!adminEmailsRaw) return false
  const set = new Set(adminEmailsRaw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean))
  return set.has(email.trim().toLowerCase())
}
