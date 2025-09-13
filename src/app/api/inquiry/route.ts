export const runtime = 'nodejs'
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


type RecipientRow = { email: string }
const recipients: string[] = !recErr && recData
? (recData as RecipientRow[]).map((r) => r.email).filter(Boolean)
: []


const fallback = process.env.NOTIFY_FALLBACK
const toList = recipients.length ? recipients : (fallback ? [fallback] : [])


if (toList.length) {
const { sendNewInquiryCustomer, sendNewInquiryCommittee } = await import('@/modules/notifications/email')


const payload = {
bookingId,
token,
name: body.name,
email: body.email,
phone: body.phone,
eventType: body.eventType,
startDate,
endDate,
description: body.description ?? null
} as const


Promise.allSettled([
sendNewInquiryCustomer(body.email, payload),
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