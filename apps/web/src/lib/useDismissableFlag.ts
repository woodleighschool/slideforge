import { useState } from "react";

/** A one-time UI flag persisted in localStorage (terms accepted, a banner
 * dismissed). `visible` starts false until the effect below has had a chance
 * to check localStorage, so nothing flashes on first paint. */
export function useDismissableFlag(key: string, shouldShowInitially: () => boolean) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(key) === "true");

  function dismiss() {
    localStorage.setItem(key, "true");
    setDismissed(true);
  }

  const visible = !dismissed && shouldShowInitially();
  return { visible, dismiss };
}
