import IntakeClient from "./IntakeClient";

interface Params {
  id: string;
}

export default async function Page(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  return <IntakeClient bookingId={id} />;
}
