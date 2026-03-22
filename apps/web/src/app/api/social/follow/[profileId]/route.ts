import { prisma } from "@playseed/db";
import { resolveOrCreateProfile } from "../../_shared";

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

    await prisma.socialFollow.deleteMany({
      where: {
        followerProfileId: actor.id,
        followingProfileId: profileId,
      },
    });

    return Response.json({ ok: true, profileId });
  } catch (e: any) {
    return Response.json(
      { error: "UNFOLLOW_FAILED", message: e?.message ?? "Failed to unfollow" },
      { status: 500 }
    );
  }
}
