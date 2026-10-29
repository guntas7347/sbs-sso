import { getSampleUsers } from "@/lib/dev";
import DevClient from "./DevClient";

export default async function DevPage() {
  const sampleUsers = await getSampleUsers();
  return <DevClient sampleUsers={sampleUsers} />;
}
