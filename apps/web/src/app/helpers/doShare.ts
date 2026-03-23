type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export async function doShare(payload: SharePayload) {
  const shareText = `${payload.text}\n${payload.url}`;

  try {
    await navigator.clipboard.writeText(shareText);
    return { ok: true, method: "clipboard" as const };
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = shareText;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const copied = document.execCommand("copy");
      document.body.removeChild(ta);
      return copied
        ? { ok: true, method: "clipboard" as const }
        : { ok: false, method: "clipboard-failed" as const };
    } catch {
      return { ok: false, method: "clipboard-failed" as const };
    }
  }
}
