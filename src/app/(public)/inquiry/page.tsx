"use client";

import { useState } from "react";
import { ZodError, ZodIssue } from "zod";
import { InquiryInputSchema } from "@/modules/booking/schemas";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; bookingId: string; token: string; eventDate: string }
  | { status: "error"; message: string };

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "Unknown error";
  }
}

export default function InquiryPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    description: "",
  });
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setState({ status: "submitting" });

    // client-side validation (zod)
    try {
      InquiryInputSchema.parse(form);
    } catch (e: unknown) {
      const zerrs: Record<string, string> = {};
      if (e instanceof ZodError) {
        (e.issues as ZodIssue[]).forEach((i) => {
          const key = i.path?.[0];
          if (typeof key === "string") zerrs[key] = i.message;
        });
      } else {
        zerrs["_"] = getErrorMessage(e);
      }
      setErrors(zerrs);
      setState({ status: "idle" });
      return;
    }

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json: { ok: boolean; bookingId?: string; token?: string; error?: string } = await res.json();

      if (!res.ok || !json.ok || !json.bookingId || !json.token) {
        throw new Error(json.error || "Failed to submit");
      }
      setState({ status: "success", bookingId: json.bookingId, token: json.token, eventDate: form.eventDate });
    } catch (e: unknown) {
      setState({ status: "error", message: getErrorMessage(e) });
    }
  }

  const disabled = state.status === "submitting";

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Request a Date</h1>
        <p className="mt-2 text-slate-600">Submit your preferred date and we’ll get back to you shortly.</p>

        {state.status === "success" ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-medium text-emerald-900">Thanks! We received your inquiry.</h2>
            <p className="mt-2 text-emerald-800">
              We’ll review availability for <span className="font-semibold">{state.eventDate}</span> and reach out by
              email.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                name="name"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.name}
                onChange={onChange}
                disabled={disabled}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.email}
                  onChange={onChange}
                  disabled={disabled}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  name="phone"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.phone}
                  onChange={onChange}
                  disabled={disabled}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Event type</label>
                <input
                  name="eventType"
                  placeholder="Birthday, Wedding, Pooja..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.eventType}
                  onChange={onChange}
                  disabled={disabled}
                />
                {errors.eventType && <p className="mt-1 text-sm text-red-600">{errors.eventType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Preferred date</label>
                <input
                  name="eventDate"
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.eventDate}
                  onChange={onChange}
                  disabled={disabled}
                />
                {errors.eventDate && <p className="mt-1 text-sm text-red-600">{errors.eventDate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Details (optional)</label>
              <textarea
                name="description"
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.description}
                onChange={onChange}
                disabled={disabled}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {state.status === "error" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 disabled:opacity-60"
              >
                {state.status === "submitting" ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
