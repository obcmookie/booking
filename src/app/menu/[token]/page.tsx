import MenuClient from "./MenuClient";

interface Params {
  token: string;
}

export default async function Page(props: { params: Promise<Params> }) {
  const { token } = await props.params;
  return <MenuClient token={token} />;
}
