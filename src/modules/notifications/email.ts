import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'Booking <no-reply@example.com>'

let resend: Resend | null = null
try {
  if (RESEND_API_KEY) {
    resend = new Resend(RESEND_API_KEY)
  }
} catch (e) {
  resend = null
}

export type InquiryMailPayload = {
  bookingId: string
  token: string
  name: string
  email: string
  phone: string
  eventType: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  description?: string | null
}

function customerHtml(p: InquiryMailPayload) {
  return `
  <div>
    <p>Hi ${p.name},</p>
    <p>We received your inquiry for <strong>${p.eventType}</strong> between <strong>${p.startDate}</strong> and <strong>${p.endDate}</strong>.</p>
    <p>Our team will review availability and get back to you shortly.</p>
    <hr/>
    <p><strong>Details</strong></p>
    <ul>
      <li>Name: ${p.name}</li>
      <li>Email: ${p.email}</li>
      <li>Phone: ${p.phone}</li>
      <li>Date range: ${p.startDate} → ${p.endDate}</li>
      ${p.description ? `<li>Notes: ${p.description}</li>` : ''}
      <li>Reference ID: ${p.bookingId}</li>
    </ul>
  </div>`
}

function committeeHtml(p: InquiryMailPayload) {
  return `
  <div>
    <p>New booking inquiry received.</p>
    <ul>
      <li><strong>ID</strong>: ${p.bookingId}</li>
      <li><strong>Name</strong>: ${p.name}</li>
      <li><strong>Email</strong>: ${p.email}</li>
      <li><strong>Phone</strong>: ${p.phone}</li>
      <li><strong>Event type</strong>: ${p.eventType}</li>
      <li><strong>Date range</strong>: ${p.startDate} → ${p.endDate}</li>
      ${p.description ? `<li><strong>Notes</strong>: ${p.description}</li>` : ''}
    </ul>
  </div>`
}

export async function sendNewInquiryCustomer(to: string, payload: InquiryMailPayload) {
  if (!resend) return { skipped: true as const, reason: 'RESEND_API_KEY not set' as const }
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'We received your inquiry',
    html: customerHtml(payload),
  })
  return { ok: true as const }
}

export async function sendNewInquiryCommittee(toList: string[], payload: InquiryMailPayload) {
  if (!resend) return { skipped: true as const, reason: 'RESEND_API_KEY not set' as const }
  if (!toList?.length) return { skipped: true as const, reason: 'no recipients' as const }
  await resend.emails.send({
    from: EMAIL_FROM,
    to: toList,
    subject: `New Inquiry: ${payload.eventType} (${payload.startDate} → ${payload.endDate})`,
    html: committeeHtml(payload),
  })
  return { ok: true as const }
}
