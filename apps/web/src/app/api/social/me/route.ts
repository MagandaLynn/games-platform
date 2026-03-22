import { prisma } from "@playseed/db";
import { resolveOrCreateProfile, sanitizeHandle, withFollowCounts } from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profile = await resolveOrCreateProfile();
    const counts = await withFollowCounts(profile.id);

    return Response.json({
      profile: {
        id: profile.id,
        handle: profile.handle,
        displayName: profile.displayName,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        counts,
      },
      created: false,
    });
  } catch (e: any) {
    return Response.json(
      { error: "PROFILE_READ_FAILED", message: e?.message ?? "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const profile = await resolveOrCreateProfile();
    const body = await req.json().catch(() => ({}));

    const handleRaw = typeof body.handle === "string" ? body.handle : "";
    const displayNameRaw = typeof body.displayName === "string" ? body.displayName.trim() : "";

    const update: { handle?: string; displayName?: string | null } = {};

    if (handleRaw) {
      const handle = sanitizeHandle(handleRaw);
      if (!handle) {
        return Response.json({ error: "INVALID_HANDLE" }, { status: 400 });
      }

      const existing = await prisma.socialProfile.findUnique({ where: { handle } });
      if (existing && existing.id !== profile.id) {
        return Response.json({ error: "HANDLE_TAKEN" }, { status: 409 });
      }

      update.handle = handle;
    }

    if (typeof body.displayName === "string") {
      update.displayName = displayNameRaw || null;
    }

    const next = Object.keys(update).length
      ? await prisma.socialProfile.update({ where: { id: profile.id }, data: update })
      : profile;

    const counts = await withFollowCounts(next.id);

    return Response.json({
      profile: {
        id: next.id,
        handle: next.handle,
        displayName: next.displayName,
        createdAt: next.createdAt.toISOString(),
        updatedAt: next.updatedAt.toISOString(),
        counts,
      },
      created: false,
    });
  } catch (e: any) {
    return Response.json(
      { error: "PROFILE_UPDATE_FAILED", message: e?.message ?? "Failed to update profile" },
      { status: 500 }
    );
  }
}
