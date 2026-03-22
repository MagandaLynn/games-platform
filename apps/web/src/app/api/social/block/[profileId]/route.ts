import { prisma } from "@playseed/db";
import { ensureSocialBlockTable, resolveOrCreateProfile } from "../../_shared";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const actor = await resolveOrCreateProfile();
    const { profileId } = await params;

    if (!profileId) {
      return Response.json({ error: "INVALID_PROFILE_ID" }, { status: 400 });
    }

    await ensureSocialBlockTable();

    try {
      await prisma.$executeRaw`
        DELETE FROM "SocialBlock"
        WHERE "blockerProfileId" = ${actor.id}
          AND "blockedProfileId" = ${profileId}
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? "");
      if (message.includes("SocialBlock") && (message.includes("does not exist") || message.includes("42P01"))) {
        return Response.json({ error: "BLOCKING_NOT_AVAILABLE" }, { status: 501 });
      }
      throw error;
    }

    return Response.json({ ok: true, profileId });
  } catch (e: any) {
    return Response.json(
      { error: "UNBLOCK_FAILED", message: e?.message ?? "Failed to unblock profile" },
      { status: 500 }
    );
  }
}
