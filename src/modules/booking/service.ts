import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";
import { InquiryInput, InquiryInputSchema } from "./schemas";

export async function createInquiry(input: InquiryInput): Promise<{ id: string; token: string }> {
  const parsed = InquiryInputSchema.parse(input);

  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("rpc_create_public_booking", {
    p_customer_name: parsed.name.trim(),
    p_customer_email: parsed.email.trim(),
    p_customer_phone: parsed.phone.trim(),
    p_event_type: parsed.eventType.trim(),
    p_event_date: parsed.eventDate,          // 'YYYY-MM-DD'
    p_description: parsed.description ?? null,
  });

  if (error) {
    console.error("rpc_create_public_booking error:", error);
    throw new Error("Unable to create your inquiry. Please try again.");
  }

  // Function returns a TABLE (single row). Supabase returns either an array or object depending on PG.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.booking_id || !row?.customer_token) {
    throw new Error("Unexpected response from booking RPC.");
  }

  return { id: row.booking_id as string, token: row.customer_token as string };
}
