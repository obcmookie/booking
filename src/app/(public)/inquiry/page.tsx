'use client'
import React from 'react'


export default function InquiryPage() {
const [name, setName] = React.useState('')
const [email, setEmail] = React.useState('')
const [phone, setPhone] = React.useState('')
const [eventType, setEventType] = React.useState('')
const [startDate, setStartDate] = React.useState('')
const [endDate, setEndDate] = React.useState('')
const [description, setDescription] = React.useState('')
const [submitting, setSubmitting] = React.useState(false)
const [msg, setMsg] = React.useState<string | null>(null)
const [err, setErr] = React.useState<string | null>(null)


async function onSubmit(e: React.FormEvent) {
e.preventDefault()
setMsg(null)
setErr(null)


if (!startDate || !endDate) return setErr('Please select a start and end date')
if (new Date(endDate) < new Date(startDate)) return setErr('End date must be the same or after start date')


setSubmitting(true)
try {
const res = await fetch('/api/inquiry', {
method: 'POST',
headers: { 'content-type': 'application/json' },
body: JSON.stringify({ name, email, phone, eventType, startDate, endDate, description: description || undefined }),
})
const data = await res.json()
if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Submission failed')
setMsg('Inquiry submitted! Please check your email.')
setName(''); setEmail(''); setPhone(''); setEventType(''); setStartDate(''); setEndDate(''); setDescription('')
} catch (e: unknown) {
setErr(e instanceof Error ? e.message : 'Submission failed')
} finally {
setSubmitting(false)
}
}


return (
<main className="container">
<h1>Request a Date</h1>
{msg && <p className="ok">{msg}</p>}
{err && <p className="error">{err}</p>}
<form onSubmit={onSubmit} className="form">
<label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
<label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
<label>Event Type<input value={eventType} onChange={(e) => setEventType(e.target.value)} required /></label>
<div className="row">
<label>Start Date<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
<label>End Date<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></label>
</div>
<label>Notes (optional)<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
<div className="actions">
<button type="submit" disabled={submitting}>Submit</button>
</div>
</form>
</main>
)
}