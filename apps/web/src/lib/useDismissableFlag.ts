import { useState } from "react";

function wasDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function useDismissableFlag(key: string, shouldShowInitially: () => boolean) {
  const [dismissed, setDismissed] = useState(() => wasDismissed(key));

  function dismiss() {
    try {
      localStorage.setItem(key, "true");
    } catch {
      // Dismiss for this tab even when persistent browser storage is unavailable.
    }
    setDismissed(true);
  }

  return { visible: !dismissed && shouldShowInitially(), dismiss };
}
