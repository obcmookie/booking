'use client'

import React from 'react'

export default function CalendarClient() {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [eventType, setEventType] = React.useState('')
  const [startDate, setStartDate] = React.useState('') // YYYY-MM-DD
  const [endDate, setEndDate] = React.useState('') // YYYY-MM-DD
  const [description, setDescription] = React.useState('')

  const [error, setError] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState<string | null>(null)

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setEventType('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setError(null)
    setOk(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)

    if (!startDate || !endDate) {
      setError('Please select a start and end date')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be the same or after start date')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          eventType,
          startDate,
          endDate,
          description: description || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Submission failed')
      } else {
        setOk('Inquiry submitted! Check your email for confirmation.')
        reset()
        setOpen(false)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Replace with your actual calendar UI */}
      <button className="btn primary" onClick={() => setOpen(true)}>
        Request a Date
      </button>

      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Request a Date</h3>
            {error && <p className="error">{error}</p>}
            {ok && <p className="ok">{ok}</p>}

            <form onSubmit={onSubmit}>
              <div className="grid">
                <label>
                  Name
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>

                <label>
                  Event Type
                  <input value={eventType} onChange={(e) => setEventType(e.target.value)} required />
                </label>

                <label>
                  Start Date
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </label>

                <label className="col-span-2">
                  Notes (optional)
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
              </div>

              <div className="actions">
                <button type="button" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
