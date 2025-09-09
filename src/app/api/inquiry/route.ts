import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InquiryInputSchema } from "@/modules/booking/schemas";
import { createInquiry } from "@/modules/booking/service";

function getErrorMessage(e: unknown): string {
  if (e instanceof ZodError) return e.issues?.[0]?.message ?? "Validation error";
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "Unknown error";
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = InquiryInputSchema.parse(json);

    const { id, token } = await createInquiry(input);
    return NextResponse.json({ ok: true, bookingId: id, token }, { status: 200 });
  } catch (e: unknown) {
    console.error("POST /api/inquiry", e);
    const message = getErrorMessage(e);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
