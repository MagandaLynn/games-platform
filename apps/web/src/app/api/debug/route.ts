// apps/web/src/app/api/debug/session/route.ts
import { auth } from "@clerk/nextjs/server";
import { requireSessionId } from "@/server/session";
export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  const sessionId = await requireSessionId();

  return Response.json({ sessionId, userId });
}
