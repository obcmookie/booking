import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INQUIRY_TO = process.env.INQUIRY_TO;       // e.g. "bookings@yourdomain.com"
const INQUIRY_FROM = process.env.INQUIRY_FROM;   // e.g. "Umiya Booking <noreply@yourdomain.com>"

if (!RESEND_API_KEY || !INQUIRY_TO || !INQUIRY_FROM) {
  throw new Error(
    "Missing mail env vars. Please set RESEND_API_KEY, INQUIRY_TO, and INQUIRY_FROM.",
  );
}

const resend = new Resend(RESEND_API_KEY);

type ISODateString = string;

type InquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  eventType?: string;
  requestedStartDate?: ISODateString;
  requestedEndDate?: ISODateString;
  eventDate?: ISODateString;    // optional single date, if you use it
  source?: string;              // optional attribution
  zip?: string;                 // optional postal code
  consentMarketing?: boolean;   // optional checkbox
};

function isISODate(s: string): boolean {
  // simple sanity check (YYYY-MM-DD or full ISO); adjust if you need stricter validation
  return /^\d{4}-\d{2}-\d{2}/.test(s) || !Number.isNaN(Date.parse(s));
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function isInquiryPayload(x: unknown): x is InquiryPayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (!isNonEmptyString(o.name)) return false;
  if (!isNonEmptyString(o.email)) return false;
  if (!isNonEmptyString(o.message)) return false;

  if (o.requestedStartDate && typeof o.requestedStartDate === "string" && !isISODate(o.requestedStartDate)) {
    return false;
  }
  if (o.requestedEndDate && typeof o.requestedEndDate === "string" && !isISODate(o.requestedEndDate)) {
    return false;
  }
  if (o.eventDate && typeof o.eventDate === "string" && !isISODate(o.eventDate)) {
    return false;
  }
  if (o.phone !== undefined && typeof o.phone !== "string") return false;
  if (o.eventType !== undefined && typeof o.eventType !== "string") return false;
  if (o.source !== undefined && typeof o.source !== "string") return false;
  if (o.zip !== undefined && typeof o.zip !== "string") return false;
  if (o.consentMarketing !== undefined && typeof o.consentMarketing !== "boolean") return false;

  return true;
}

function fmtDate(d?: string): string {
  if (!d) return "-";
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? d : parsed.toLocaleString();
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSubject(p: InquiryPayload): string {
  const type = p.eventType ? ` – ${p.eventType}` : "";
  const range =
    p.requestedStartDate || p.requestedEndDate
      ? ` (${p.requestedStartDate ?? "?"} → ${p.requestedEndDate ?? "?"})`
      : p.eventDate
      ? ` (${p.eventDate})`
      : "";
  return `New Inquiry from ${p.name}${type}${range}`;
}

function buildText(p: InquiryPayload): string {
  return [
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    `Phone: ${p.phone ?? "-"}`,
    `Event Type: ${p.eventType ?? "-"}`,
    `Requested Start: ${p.requestedStartDate ?? "-"}`,
    `Requested End: ${p.requestedEndDate ?? "-"}`,
    `Event Date: ${p.eventDate ?? "-"}`,
    `ZIP: ${p.zip ?? "-"}`,
    `Source: ${p.source ?? "-"}`,
    `Marketing Consent: ${p.consentMarketing ? "Yes" : "No"}`,
    "",
    "Message:",
    p.message,
  ].join("\n");
}

function buildHtml(p: InquiryPayload): string {
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; font-size:14px; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 8px 0;">New Inquiry</h2>
    <table style="border-collapse: collapse; width:100%; max-width:640px;">
      <tbody>
        <tr><td style="padding:6px 8px; font-weight:600;">Name</td><td style="padding:6px 8px;">${escapeHtml(p.name)}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Email</td><td style="padding:6px 8px;">${escapeHtml(p.email)}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Phone</td><td style="padding:6px 8px;">${escapeHtml(p.phone ?? "-")}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Event Type</td><td style="padding:6px 8px;">${escapeHtml(p.eventType ?? "-")}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Requested Start</td><td style="padding:6px 8px;">${escapeHtml(fmtDate(p.requestedStartDate))}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Requested End</td><td style="padding:6px 8px;">${escapeHtml(fmtDate(p.requestedEndDate))}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Event Date</td><td style="padding:6px 8px;">${escapeHtml(fmtDate(p.eventDate))}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">ZIP</td><td style="padding:6px 8px;">${escapeHtml(p.zip ?? "-")}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Source</td><td style="padding:6px 8px;">${escapeHtml(p.source ?? "-")}</td></tr>
        <tr><td style="padding:6px 8px; font-weight:600;">Marketing Consent</td><td style="padding:6px 8px;">${p.consentMarketing ? "Yes" : "No"}</td></tr>
      </tbody>
    </table>
    <div style="margin-top:12px;">
      <div style="font-weight:600; margin-bottom:4px;">Message</div>
      <div style="white-space:pre-wrap;">${escapeHtml(p.message)}</div>
    </div>
  </div>
  `.trim();
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as unknown;
    if (!isInquiryPayload(json)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const payload = json;

    // Send the email
    const { error } = await resend.emails.send({
      from: INQUIRY_FROM,
      to: INQUIRY_TO,
      subject: buildSubject(payload),
      text: buildText(payload),
      html: buildHtml(payload),
      reply_to: payload.email,
      headers: {
        "X-Inquiry-Event-Type": payload.eventType ?? "",
        "X-Inquiry-Source": payload.source ?? "",
      },
    });

    if (error) {
      // Resend returns a typed error object; do not expose internal details
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
