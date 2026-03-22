import { prisma } from "@playseed/db";
import { ensureSocialBlockTable, resolveOrCreateProfile } from "../_shared";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const actor = await resolveOrCreateProfile();
    const body = await req.json().catch(() => ({}));
    const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";

    if (!profileId) {
      return Response.json({ error: "INVALID_PROFILE_ID" }, { status: 400 });
    }

    if (profileId === actor.id) {
      return Response.json({ error: "CANNOT_BLOCK_SELF" }, { status: 409 });
    }

    const target = await prisma.socialProfile.findUnique({ where: { id: profileId } });
    if (!target) {
      return Response.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    }

    await ensureSocialBlockTable();

    let existing: Array<{ id: string }> = [];
    try {
      existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "SocialBlock"
        WHERE "blockerProfileId" = ${actor.id}
          AND "blockedProfileId" = ${profileId}
        LIMIT 1
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? "");
      if (message.includes("SocialBlock") && (message.includes("does not exist") || message.includes("42P01"))) {
        return Response.json({ error: "BLOCKING_NOT_AVAILABLE" }, { status: 501 });
      }
      throw error;
    }

    if (existing.length > 0) {
      return Response.json({ ok: true, alreadyBlocked: true, profileId });
    }

    try {
      await prisma.$transaction([
        prisma.socialFollow.deleteMany({
          where: {
            OR: [
              { followerProfileId: actor.id, followingProfileId: profileId },
              { followerProfileId: profileId, followingProfileId: actor.id },
            ],
          },
        }),
        prisma.$executeRaw`
          INSERT INTO "SocialBlock" ("id", "blockerProfileId", "blockedProfileId", "createdAt")
          VALUES (${crypto.randomUUID()}, ${actor.id}, ${profileId}, NOW())
        `,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? "");
      if (message.includes("SocialBlock") && (message.includes("does not exist") || message.includes("42P01"))) {
        return Response.json({ error: "BLOCKING_NOT_AVAILABLE" }, { status: 501 });
      }
      throw error;
    }

    return Response.json({ ok: true, alreadyBlocked: false, profileId });
  } catch (e: any) {
    return Response.json(
      { error: "BLOCK_FAILED", message: e?.message ?? "Failed to block profile" },
      { status: 500 }
    );
  }
}
