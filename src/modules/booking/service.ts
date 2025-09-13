// src/modules/booking/service.ts
import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";
import { InquiryInputSchema, type InquiryInput } from "./schemas";

export async function createInquiry(input: InquiryInput): Promise<{ id: string; token: string }> {
  const parsed = InquiryInputSchema.parse(input);

  // Normalize dates from the union
  const eventDate = "eventDate" in parsed ? parsed.eventDate : undefined;
  const startDate = "startDate" in parsed ? parsed.startDate : eventDate;
  const endDate   = "endDate"   in parsed ? parsed.endDate   : eventDate;

  const token = crypto.randomUUID().replace(/-/g, "");
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("bookings")
    .insert({
      customer_name: parsed.name,
      customer_email: parsed.email,
      customer_phone: parsed.phone || null,
      event_type: parsed.eventType || "OTHER",
      status: "NEW",
      block_type: "TBD",
      event_date: eventDate ?? null,                     // scheduled day (legacy single date)
      requested_start_date: startDate ?? null,           // date-range support
      requested_end_date: endDate ?? null,               // date-range support
      notes_public: parsed.description || null,
      source: "PUBLIC",
      customer_token: token,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Insert failed");
  }

  // Audit trail
  await sb.from("booking_status_events").insert({
    booking_id: data.id,
    old_status: null,
    new_status: "NEW",
    note:
      startDate && endDate && startDate !== endDate
        ? `Public inquiry created (range ${startDate} → ${endDate})`
        : `Public inquiry created${eventDate ? ` (date ${eventDate})` : ""}`,
    user_id: null,
  });

  return { id: data.id, token };
}
