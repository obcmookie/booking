import CalendarClient from "./components/CalendarClient";

export const metadata = { title: "Temple Booking" };

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
          Temple Calendar & Booking
        </h1>
        <p className="mt-2 text-slate-600">
          Browse temple events and busy times. Click a date to request your booking.
        </p>

        <div className="mt-8">
          <CalendarClient />
        </div>
      </section>
    </main>
  );
}
