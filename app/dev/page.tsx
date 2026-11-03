import { getSampleUsers } from "@/app/dev/dev";
import DevClient from "./DevClient";
import { notFound } from "next/navigation";

const prod = process.env.NODE_ENV === "production";

export default async function DevPage() {
  const sampleUsers = await getSampleUsers();

  if (prod) return notFound();

  return <DevClient sampleUsers={sampleUsers} />;
}
