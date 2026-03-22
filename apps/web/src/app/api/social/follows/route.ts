import { prisma } from "@playseed/db";
import { resolveOrCreateProfile } from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await resolveOrCreateProfile();

    const follows = await prisma.socialFollow.findMany({
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
    });

    return Response.json({
      follows: follows.map((f) => ({
        profileId: f.following.id,
        handle: f.following.handle,
        displayName: f.following.displayName,
        followedAt: f.createdAt.toISOString(),
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
