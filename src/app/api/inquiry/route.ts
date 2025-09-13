import { z } from 'zod'
import { InquiryAnySchema } from '@/modules/booking/schemas'
import { createClient } from '@supabase/supabase-js'

// Use the simple Request type for route handlers
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const json = await req.json()

    const parsed = InquiryAnySchema.safeParse(json)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten() }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    const body = parsed.data as any
    const startDate: string = body.startDate ?? body.eventDate
    const endDate: string = body.endDate ?? body.eventDate

    // 1) Create booking via RPC (event_date = startDate)
    const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc(
      'rpc_create_public_booking',
      {
        p_customer_name: body.name,
        p_customer_email: body.email,
        p_customer_phone: body.phone,
        p_event_type: body.eventType,
        p_event_date: startDate,
        p_description: body.description ?? null
      }
    )

    if (rpcErr) {
      console.error('rpc_create_public_booking error', rpcErr)
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows
    const bookingId: string | undefined = row?.booking_id
    const token: string | undefined = row?.customer_token

    if (!bookingId || !token) {
      return new Response(
        JSON.stringify({ error: 'Invalid RPC response' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    // 2) Update requested date range
    const { error: updErr } = await supabaseAdmin
      .from('bookings')
      .update({
        requested_start_date: startDate,
        requested_end_date: endDate
      })
      .eq('id', bookingId)

    if (updErr) {
      console.error('Failed to update requested dates', updErr)
      // Not fatal
    }

    // 3) Notifications — read recipients from DB; fallback to env
    try {
      const { data: recData, error: recErr } = await supabaseAdmin
        .from('notification_recipients')
        .select('email')
        .eq('purpose', 'NEW_INQUIRY')
        .eq('enabled', true)

      const recipients: string[] = !recErr && recData
        ? recData.map((r: any) => r.email).filter(Boolean)
        : []

      const fallback = process.env.NOTIFY_FALLBACK
      const toList = recipients.length ? recipients : (fallback ? [fallback] : [])

      if (toList.length) {
        // Lazy import to avoid bundling issues if email creds are missing
        const { sendNewInquiryCustomer, sendNewInquiryCommittee } = await import('@/modules/notifications/email')

        const payload = {
          bookingId,
          token,
          name: body.name as string,
          email: body.email as string,
          phone: body.phone as string,
          eventType: body.eventType as string,
          startDate,
          endDate,
          description: body.description ?? null
        } as const

        Promise.allSettled([
          sendNewInquiryCustomer(body.email as string, payload),
          sendNewInquiryCommittee(toList, payload)
        ]).catch((e) => console.error('email send error', e))
      }
    } catch (e) {
      console.error('notifications section error', e)
    }

    return new Response(
      JSON.stringify({ ok: true, bookingId, token }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (e) {
    console.error('POST /api/inquiry exception', e)
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
