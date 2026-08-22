export interface SentEmail {
  to: string
  subject: string
  html: string
  text: string
}

export interface DevTransport {
  captured: SentEmail[]
  send(email: SentEmail): Promise<void>
}

/** 本地/测试用：捕获邮件并把链接打印到控制台，绝不真发。
 *  redactBody：生产构建缺 RESEND_API_KEY 的降级路径——verify/reset 链接等同账号接管
 *  凭证，不许进生产日志，只留一条可观测的告警。 */
export function createDevTransport(opts?: { redactBody?: boolean }): DevTransport {
  const captured: SentEmail[] = []
  return {
    captured,
    async send(email) {
      captured.push(email)
      if (opts?.redactBody) {
        console.warn(`[dev-email] RESEND_API_KEY missing — email NOT delivered: → ${email.to} | ${email.subject}`)
      } else {
        console.log(`\n[dev-email] → ${email.to} | ${email.subject}\n${email.text}\n`)
      }
    },
  }
}
