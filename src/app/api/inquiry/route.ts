// src/app/api/inquiry/route.ts
'rpc_create_public_booking',
{
p_customer_name: body.name,
p_customer_email: body.email,
p_customer_phone: body.phone,
p_event_type: body.eventType,
p_event_date: startDate,
p_description: body.description ?? null,
}
);


if (rpcErr) {
console.error('rpc_create_public_booking error', rpcErr);
return new Response(JSON.stringify({ error: 'Failed to create booking' }), { status: 500 });
}


const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows; // returns table(booking_id, customer_token)
const bookingId: string = row?.booking_id;
const token: string = row?.customer_token;


if (!bookingId || !token) {
return new Response(JSON.stringify({ error: 'Invalid RPC response' }), { status: 500 });
}


// 2) Update requested date range
const { error: updErr } = await supabaseAdmin
.from('bookings')
.update({
requested_start_date: startDate,
requested_end_date: endDate,
})
.eq('id', bookingId);


if (updErr) {
console.error('Failed to update requested dates', updErr);
// continue; not fatal for the requester
}


// 3) Notifications
// Pull recipients from DB; fallback to env if none.
let recipients: string[] = [];
const { data: recData, error: recErr } = await supabaseAdmin
.from('notification_recipients')
.select('email')
.eq('purpose', 'NEW_INQUIRY')
.eq('enabled', true);


if (!recErr && recData) {
recipients = recData.map((r: any) => r.email).filter(Boolean);
}
const fallback = process.env.NOTIFY_FALLBACK;
if (!recipients.length && fallback) recipients = [fallback];


const payload = {
bookingId,
token,
name: body.name,
email: body.email,
phone: body.phone,
eventType: body.eventType,
startDate,
endDate,
description: body.description ?? null,
} as const;


// Fire-and-forget; do not block the response on email success
Promise.allSettled([
sendNewInquiryCustomer(body.email, payload),
sendNewInquiryCommittee(recipients, payload),
]).catch((e) => console.error('email send error', e));


return new Response(
JSON.stringify({ ok: true, bookingId, token }),
{ status: 200, headers: { 'content-type': 'application/json' } }
);
} catch (e) {
console.error('POST /api/inquiry exception', e);
return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 });
}
}