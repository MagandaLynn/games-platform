import { cookies } from "next/headers";

export async function requireSessionId(): Promise<string> {
  const store = await cookies();
  const sid = store.get("sid")?.value;
  if (!sid) throw new Error("Missing sid cookie");
  return sid;
}
