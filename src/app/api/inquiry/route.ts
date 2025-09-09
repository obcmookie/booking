import { NextResponse } from "next/server";
import { InquiryInputSchema } from "@/modules/booking/schemas";
import { createInquiry } from "@/modules/booking/service";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = InquiryInputSchema.parse(json);

    const { id, token } = await createInquiry(input);
    return NextResponse.json({ ok: true, bookingId: id, token }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/inquiry", err);
    const message = err?.issues?.[0]?.message ?? err?.message ?? "Invalid request";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
