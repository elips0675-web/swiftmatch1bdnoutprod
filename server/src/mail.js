import nodemailer from 'nodemailer'

let transporter = null

const RETRY_MAX = 3
const RETRY_DELAY_MS = 1000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  if (!host) return null

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) {
    console.log('[mail] SMTP_USER or SMTP_PASS not set, emails disabled')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
  return transporter
}

const FROM = process.env.SMTP_FROM || 'noreply@swiftmatch.app'

async function sendWithRetry(mailOptions) {
  const transport = getTransporter()
  if (!transport) {
    console.log(`[mail] SMTP not configured. Would send to ${mailOptions.to}: "${mailOptions.subject}"`)
    return
  }

  let lastError
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      await transport.sendMail(mailOptions)
      console.log(`[mail] Sent to ${mailOptions.to}: "${mailOptions.subject}"`)
      return
    } catch (err) {
      lastError = err
      console.error(`[mail] Attempt ${attempt}/${RETRY_MAX} failed for ${mailOptions.to}:`, err.message)
      if (attempt < RETRY_MAX) await sleep(RETRY_DELAY_MS * attempt)
    }
  }

  throw lastError
}

export async function sendPasswordResetEmail(to, token) {
  const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/reset-password?token=${token}`
  return sendWithRetry({
    from: FROM,
    to,
    subject: 'Reset your SwiftMatch password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  })
}

export async function sendVerificationEmail(to, token) {
  const verifyUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/verify-email?token=${token}`
  return sendWithRetry({
    from: FROM,
    to,
    subject: 'Verify your SwiftMatch email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
  })
}
