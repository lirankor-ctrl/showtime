import { useCallback, useRef, useState } from "react";

// Minimal transient toast: returns the element to render + a trigger function.
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2200);
  }, []);

  const toast = message ? <div className="toast">{message}</div> : null;
  return { toast, showToast };
}
