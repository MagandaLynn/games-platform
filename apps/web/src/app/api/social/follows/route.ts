import { prisma } from "@playseed/db";
import { resolveOrCreateProfile } from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await resolveOrCreateProfile();

    const blockedPromise = (async () => {
      try {
        return await prisma.$queryRaw<
          Array<{ profileId: string; handle: string; displayName: string | null; blockedAt: Date }>
        >`
          SELECT
            p."id" as "profileId",
            p."handle" as "handle",
            p."displayName" as "displayName",
            b."createdAt" as "blockedAt"
          FROM "SocialBlock" b
          JOIN "SocialProfile" p ON p."id" = b."blockedProfileId"
          WHERE b."blockerProfileId" = ${actor.id}
          ORDER BY b."createdAt" DESC
        `;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error ?? "");
        if (message.includes("SocialBlock") && (message.includes("does not exist") || message.includes("42P01"))) {
          return [] as Array<{ profileId: string; handle: string; displayName: string | null; blockedAt: Date }>;
        }
        throw error;
      }
    })();

    const [follows, followers, blocked] = await Promise.all([
      prisma.socialFollow.findMany({
        where: { followerProfileId: actor.id },
        orderBy: { createdAt: "desc" },
        include: {
          following: {
            select: {
              id: true,
              handle: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.socialFollow.findMany({
        where: { followingProfileId: actor.id },
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: {
              id: true,
              handle: true,
              displayName: true,
            },
          },
        },
      }),
      blockedPromise,
    ]);

    return Response.json({
      follows: follows.map((f) => ({
        profileId: f.following.id,
        handle: f.following.handle,
        displayName: f.following.displayName,
        followedAt: f.createdAt.toISOString(),
      })),
      followers: followers.map((f) => ({
        profileId: f.follower.id,
        handle: f.follower.handle,
        displayName: f.follower.displayName,
        followedAt: f.createdAt.toISOString(),
      })),
      blocked: blocked.map((b) => ({
        profileId: b.profileId,
        handle: b.handle,
        displayName: b.displayName,
        blockedAt: b.blockedAt.toISOString(),
      })),
      count: follows.length,
    });
  } catch (e: any) {
    return Response.json(
      { error: "FOLLOWS_READ_FAILED", message: e?.message ?? "Failed to load follows" },
      { status: 500 }
    );
  }
}
