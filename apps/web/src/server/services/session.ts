import { cookies } from "next/headers";

const SESSION_COOKIE = "sid";

export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE);
  return cookie ? cookie.value : null;
}
