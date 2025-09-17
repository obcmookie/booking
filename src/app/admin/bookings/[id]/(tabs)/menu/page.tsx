import BookingMenuClient from "./BookingMenuClient";

interface Params {
  id: string;
}

export default async function Page(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  return <BookingMenuClient bookingId={id} />;
}
