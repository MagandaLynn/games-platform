import { useState } from "react";

export function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), duration);
  };

  return { message, showToast };
}
