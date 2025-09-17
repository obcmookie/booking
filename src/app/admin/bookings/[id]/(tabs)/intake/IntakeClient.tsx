"use client";

import { useEffect, useState } from "react";
import type { BookingIntake, MembershipStatus } from "@/components/types";

export default function IntakeClient({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<BookingIntake | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/bookings/${bookingId}/intake`);
      if (res.ok) {
        const payload = (await res.json()) as { intake: BookingIntake };
        if (!cancelled) setData(payload.intake);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const update = <K extends keyof BookingIntake>(key: K, value: BookingIntake[K]) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    const res = await fetch(`/api/admin/bookings/${bookingId}/intake`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) alert("Save failed");
  };

  if (loading || !data) return <div className="p-2">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Membership & Space */}
      <section className="border rounded p-3 space-y-3">
        <h2 className="font-medium">Membership & Space</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm">Membership</label>
            <select
              className="border rounded px-2 py-1 w-full"
              value={data.membership_status ?? ""}
              onChange={(e) => update("membership_status", (e.target.value || null) as MembershipStatus | null)}
            >
              <option value="">(Select)</option>
              <option value="LIFE_MEMBER">Life Member</option>
              <option value="TRUSTEE">Trustee</option>
              <option value="NON_MEMBER">Non Member</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">Primary Space</label>
            <input
              className="border rounded px-2 py-1 w-full"
              placeholder="Space name"
              value={data.primary_space_name ?? ""}
              onChange={(e) => update("primary_space_name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm">Event Type</label>
            <select
              className="border rounded px-2 py-1 w-full"
              value={data.event_type}
              onChange={(e) => update("event_type", e.target.value)}
            >
              <option value="Baby Shower">Baby Shower</option>
              <option value="Convention">Convention</option>
              <option value="Katha">Katha</option>
              <option value="Garba">Garba</option>
              <option value="Wedding">Wedding</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Start Date</label>
            <input
              type="date"
              className="border rounded px-2 py-1 w-full"
              value={data.requested_start_date ?? ""}
              onChange={(e) => update("requested_start_date", e.target.value || null)}
            />
          </div>
          <div>
            <label className="block text-sm">End Date</label>
            <input
              type="date"
              className="border rounded px-2 py-1 w-full"
              value={data.requested_end_date ?? ""}
              onChange={(e) => update("requested_end_date", e.target.value || null)}
            />
          </div>
        </div>
      </section>

      {/* Booking Person */}
      <section className="border rounded p-3 space-y-3">
        <h2 className="font-medium">Booking Person</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm">Name</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.customer_name ?? ""}
              onChange={(e) => update("customer_name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Gaam</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.gaam ?? ""}
              onChange={(e) => update("gaam", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Phone</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.customer_phone ?? ""}
              onChange={(e) => update("customer_phone", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm">Email</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.customer_email ?? ""}
              onChange={(e) => update("customer_email", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Booking For</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.booking_for_name ?? ""}
              onChange={(e) => update("booking_for_name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Relationship</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.relationship_to_booker ?? ""}
              onChange={(e) => update("relationship_to_booker", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm">Address Line 1</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.address_line1 ?? ""}
              onChange={(e) => update("address_line1", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">Address Line 2</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.address_line2 ?? ""}
              onChange={(e) => update("address_line2", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">City</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.city ?? ""}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">State</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.state ?? ""}
              onChange={(e) => update("state", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Postal Code</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={data.postal_code ?? ""}
              onChange={(e) => update("postal_code", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Vendors & Services */}
      <section className="border rounded p-3 space-y-4">
        <h2 className="font-medium">Vendors & Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.vendors_decorator_needed}
                onChange={(e) => update("vendors_decorator_needed", e.target.checked)}
              />
              Decorator
            </label>
            <textarea
              className="mt-2 w-full border rounded p-2 text-sm"
              placeholder="Notes / preferred vendor"
              value={data.vendors_decorator_notes ?? ""}
              onChange={(e) => update("vendors_decorator_notes", e.target.value)}
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.vendors_dj_needed}
                onChange={(e) => update("vendors_dj_needed", e.target.checked)}
              />
              DJ
            </label>
            <textarea
              className="mt-2 w-full border rounded p-2 text-sm"
              placeholder="Notes / preferred vendor"
              value={data.vendors_dj_notes ?? ""}
              onChange={(e) => update("vendors_dj_notes", e.target.value)}
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.vendors_cleaning_needed}
                onChange={(e) => update("vendors_cleaning_needed", e.target.checked)}
              />
              Cleaning
            </label>
            <textarea
              className="mt-2 w-full border rounded p-2 text-sm"
              placeholder="Scope / timing"
              value={data.vendors_cleaning_notes ?? ""}
              onChange={(e) => update("vendors_cleaning_notes", e.target.value)}
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.vendors_other_needed}
                onChange={(e) => update("vendors_other_needed", e.target.checked)}
              />
              Other
            </label>
            <textarea
              className="mt-2 w-full border rounded p-2 text-sm"
              placeholder="Describe other services"
              value={data.vendors_other_notes ?? ""}
              onChange={(e) => update("vendors_other_notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button className="border rounded px-4 py-2" onClick={() => void save()} disabled={saving}>
          Save
        </button>
      </div>
    </div>
  );
}
