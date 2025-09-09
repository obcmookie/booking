import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InquiryInputSchema } from "@/modules/booking/schemas";
import { createInquiry } from "@/modules/booking/service";
import { getRecipients } from "@/modules/notifications/recipients";
import { sendNewInquiryCustomer, sendNewInquiryCommittee } from "@/modules/notifications/email";

function getErrorMessage(e: unknown): string {
  if (e instanceof ZodError) return e.issues?.[0]?.message ?? "Validation error";
  if (e instanceof Error) return e.message;
  try { return String(e); } catch { return "Unknown error"; }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = InquiryInputSchema.parse(json);

    const { id, token } = await createInquiry(input);

    // Fire-and-wait (but do not fail the request if emails have issues)
    const recipients = await getRecipients("NEW_INQUIRY");
    const emailData = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      eventType: input.eventType,
      eventDate: input.eventDate,
      description: input.description || "",
      bookingId: id,
      token,
    };

    const results = await Promise.allSettled([
      sendNewInquiryCustomer(emailData),
      sendNewInquiryCommittee(emailData, recipients),
    ]);
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`email[${i}] failed`, r.reason);
    });

    return NextResponse.json({ ok: true, bookingId: id, token }, { status: 200 });
  } catch (e: unknown) {
    console.error("POST /api/inquiry", e);
    const message = getErrorMessage(e);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
