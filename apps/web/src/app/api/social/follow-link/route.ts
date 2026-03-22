import { headers } from "next/headers";
import { resolveOrCreateProfile } from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profile = await resolveOrCreateProfile();
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");

    if (!host) {
      return Response.json({ error: "MISSING_HOST" }, { status: 500 });
    }

    const followUrl = `${proto}://${host}/social?follow=${encodeURIComponent(profile.followToken)}`;

    return Response.json({
      profileId: profile.id,
      handle: profile.handle,
      token: profile.followToken,
      followUrl,
    });
  } catch (e: any) {
    return Response.json(
      { error: "FOLLOW_LINK_FAILED", message: e?.message ?? "Failed to create follow link" },
      { status: 500 }
    );
  }
}
