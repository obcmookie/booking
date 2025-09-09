import { supabaseAdmin } from "@/shared/utils/supabaseAdmin";

export async function getRecipients(purpose: "NEW_INQUIRY"): Promise<string[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("notification_recipients")
    .select("email")
    .eq("purpose", purpose)
    .eq("enabled", true);

  if (error) {
    console.error("getRecipients error:", error);
    return [];
  }

  return (data ?? []).map((r) => r.email).filter(Boolean);
}
