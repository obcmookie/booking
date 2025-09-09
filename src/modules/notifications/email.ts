import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Booking <no-reply@example.com>";
const tz = "America/New_York";

function fmtDateYYYYMMDDToLong(d: string) {
  // d = "YYYY-MM-DD"
  const parts = d.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export type InquiryEmailData = {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string; // "YYYY-MM-DD"
  description?: string;
  bookingId: string;
  token: string;
};

export async function sendNewInquiryCustomer(data: InquiryEmailData) {
  if (!resendApiKey) return { skipped: true, reason: "No RESEND_API_KEY" };
  const resend = new Resend(resendApiKey);

  const subject = "We received your booking request";
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;">
      <h2 style="margin:0 0 8px;">Thank you, ${escapeHtml(data.name)}</h2>
      <p style="margin:0 0 12px;">We've received your request for <strong>${escapeHtml(
        data.eventType
      )}</strong> on <strong>${fmtDateYYYYMMDDToLong(data.eventDate)}</strong>.</p>
      <p style="margin:0 0 12px;">A committee member will review availability and contact you at <strong>${escapeHtml(
        data.email
      )}</strong> or ${escapeHtml(data.phone)}.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
      <p style="font-size:12px;color:#64748b;margin:0;">Booking ID: ${data.bookingId}</p>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to: data.email,
    subject,
    html,
  });
}

export async function sendNewInquiryCommittee(data: InquiryEmailData, recipients: string[]) {
  if (!resendApiKey) return { skipped: true, reason: "No RESEND_API_KEY" };
  if (!recipients.length) return { skipped: true, reason: "No recipients configured" };

  const resend = new Resend(resendApiKey);

  const subject = `New Inquiry: ${data.eventType} on ${data.eventDate}`;
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;">
      <h2 style="margin:0 0 8px;">New Inquiry</h2>
      <p style="margin:0 0 6px;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p style="margin:0 0 6px;"><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
      <p style="margin:0 0 6px;"><strong>Event:</strong> ${escapeHtml(data.eventType)}</p>
      <p style="margin:0 0 6px;"><strong>Date:</strong> ${fmtDateYYYYMMDDToLong(data.eventDate)}</p>
      ${
        data.description
          ? `<p style="margin:8px 0 0;"><strong>Details:</strong><br/>${escapeHtml(data.description)}</p>`
          : ""
      }
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
      <p style="font-size:12px;color:#64748b;margin:0;">Booking ID: ${data.bookingId}</p>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to: recipients,
    subject,
    html,
  });
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
