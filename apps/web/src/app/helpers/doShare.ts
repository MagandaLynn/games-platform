type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export async function doShare(payload: SharePayload) {
  // Native share (mobile, some desktop)
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return { ok: true, method: "native" as const };
    } catch {
      // user canceled — not an error
      return { ok: false, method: "canceled" as const };
    }
  }

  // Clipboard fallback
  const shareText = `${payload.text}\n${payload.url}`;

  try {
    await navigator.clipboard.writeText(shareText);
    return { ok: true, method: "clipboard" as const };
  } catch {
    return { ok: false, method: "clipboard-failed" as const };
  }
}
