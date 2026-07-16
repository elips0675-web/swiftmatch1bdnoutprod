import { emailQueue } from './queue.js'
import { rootLogger } from './logger.js'

async function queueMail(data) {
  if (emailQueue) {
    await emailQueue.add(data)
  } else {
    rootLogger.info(`[mail] Queue not available. Would send to ${data.to}: "${data.subject}"`)
  }
}

const FROM = process.env.SMTP_FROM || 'noreply@swiftmatch.app'

export async function sendPasswordResetEmail(to, token) {
  return queueMail({
    to,
    subject: 'Reset your SwiftMatch password',
    type: 'password-reset',
    token,
    from: FROM,
  })
}

export async function sendVerificationEmail(to, token) {
  return queueMail({
    to,
    subject: 'Verify your SwiftMatch email',
    type: 'verify-email',
    token,
    from: FROM,
  })
}

export async function sendCustomEmail(to, subject, html) {
  return queueMail({ to, subject, html, from: FROM })
}
