// apps/web/src/app/api/debug/session/route.ts
import { auth } from "@clerk/nextjs/server";
import { getSessionId } from "@/server/session";

export async function GET() {
  const { userId } = await auth();
  const sessionId = await getSessionId();

  return Response.json({ sessionId, userId });
}
