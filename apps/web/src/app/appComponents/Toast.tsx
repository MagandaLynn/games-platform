"use client";

type ToastProps = {
  message: string;
};

export default function Toast({ message }: ToastProps) {
  return (
    <div
      className="
        fixed bottom-4 left-1/2 z-50 -translate-x-1/2
        rounded-xl bg-black/80 px-4 py-2
        text-sm text-white shadow-lg
      "
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
