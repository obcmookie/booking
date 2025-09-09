export const metadata = { title: "Temple Booking" };

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
          Book the Temple Hall for Your Event
        </h1>
        <p className="mt-4 text-slate-600">
          Weddings, birthdays, community gatherings—tell us your date and a committee member will follow up.
        </p>

        <a
          href="/inquiry"
          className="inline-flex mt-8 items-center justify-center rounded-xl px-5 py-3 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
        >
          Request a date
        </a>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-medium text-slate-900">How it works</h2>
          <ol className="mt-4 list-decimal pl-5 text-slate-700 space-y-2">
            <li>Submit your date and basic details.</li>
            <li>We confirm availability and send a draft proposal.</li>
            <li>Pay deposit to hold the date and lock in menu planning.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
