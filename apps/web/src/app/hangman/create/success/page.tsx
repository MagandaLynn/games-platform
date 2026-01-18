// app/hangman/create/success/page.tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function absUrl(path: string) {
  // Works locally + prod, assuming browser context
  return new URL(path, window.location.origin).toString();
}

function SuccessPageContent() {
  const params = useSearchParams();
  const instanceId = params.get("instanceId");

  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState<string | null>(null);

  const shareUrl = React.useMemo(() => {
    if (!instanceId) return "";
    return absUrl(`/hangman/i/${instanceId}`);
  }, [instanceId]);

  // Best-effort auto copy
  React.useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;

    (async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (!cancelled) setCopied(true);
      } catch (e: any) {
        // Totally normal on many browsers without a user gesture.
        if (!cancelled) setCopyError("Tap Copy to copy the link.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  async function onCopy() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopyError("Couldn’t copy automatically. Select the link and copy.");
    }
  }

  async function onNativeShare() {
    try {
      // @ts-ignore
      await navigator.share?.({
        title: "Hangman puzzle",
        text: "Try my Hangman puzzle!",
        url: shareUrl,
      });
    } catch {
      // user cancelled; ignore
    }
  }

  if (!instanceId) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="text-2xl font-extrabold">Puzzle created</h1>
        <p className="mt-2 text-sm text-text-muted">Missing instanceId.</p>
        <Link className="mt-6 inline-block text-link underline" href="/hangman/create">
          Create another
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Puzzle ready 🎉</h1>
      <p className="mt-2 text-sm text-text-muted">
        Share this link with a friend.
      </p>

      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs font-semibold text-text-muted">Share link</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={onCopy}
              className="shrink-0 rounded-lg bg-link px-3 py-2 text-sm font-extrabold text-white hover:opacity-90 transition"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {copyError && <p className="mt-2 text-xs text-text-muted">{copyError}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {"share" in navigator && (
            <button
              type="button"
              onClick={onNativeShare}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold hover:opacity-90 transition"
            >
              Share…
            </button>
          )}

          <Link
            href={`/hangman/i/${instanceId}`}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold hover:opacity-90 transition"
          >
            Play now
          </Link>

          <Link
            href="/hangman/create"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold hover:opacity-90 transition"
          >
            Create another
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CreateHangmanSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="text-2xl font-extrabold">Loading...</h1>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
