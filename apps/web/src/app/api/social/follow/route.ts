import { prisma } from "@playseed/db";
import { resolveOrCreateProfile, sanitizeHandle } from "../_shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const actor = await resolveOrCreateProfile();
    const body = await req.json().catch(() => ({}));

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const handleInput = typeof body.handle === "string" ? body.handle.trim() : "";

    if ((token ? 1 : 0) + (handleInput ? 1 : 0) !== 1) {
      return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    let target = null;
    if (token) {
      target = await prisma.socialProfile.findUnique({ where: { followToken: token } });
    } else {
      const handle = sanitizeHandle(handleInput);
      if (!handle) return Response.json({ error: "INVALID_HANDLE" }, { status: 400 });
      target = await prisma.socialProfile.findUnique({ where: { handle } });
    }

    if (!target) {
      return Response.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    }

    if (target.id === actor.id) {
      return Response.json({ error: "CANNOT_FOLLOW_SELF" }, { status: 409 });
    }

    const existing = await prisma.socialFollow.findUnique({
      where: {
        follower_following: {
          followerProfileId: actor.id,
          followingProfileId: target.id,
        },
      },
    });

    if (existing) {
      return Response.json({
        ok: true,
        alreadyFollowing: true,
        target: {
          id: target.id,
          handle: target.handle,
          displayName: target.displayName,
        },
      });
    }

    const follow = await prisma.socialFollow.create({
      data: {
        followerProfileId: actor.id,
        followingProfileId: target.id,
      },
    });

    return Response.json({
      ok: true,
      alreadyFollowing: false,
      follow: {
        followerProfileId: follow.followerProfileId,
        followingProfileId: follow.followingProfileId,
        createdAt: follow.createdAt.toISOString(),
      },
      target: {
        id: target.id,
        handle: target.handle,
        displayName: target.displayName,
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: "FOLLOW_FAILED", message: e?.message ?? "Failed to follow" },
      { status: 500 }
    );
  }
}
