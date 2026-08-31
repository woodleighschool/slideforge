import { Button } from "@/components/ui/button";
import { useDismissableFlag } from "@/lib/useDismissableFlag";

const DISMISSED_KEY = "slideforge.chromeNudgeDismissed.v1";

function isChromium(): boolean {
  // Chrome/Edge/Opera/Brave are all Chromium-based and carry one of these
  // tokens in the UA string; Safari and Firefox carry none of them. Good
  // enough for a soft nudge, not a hard gate — there's no way to force a
  // browser switch from JS, and this deliberately never tries to.
  return /Chrome\/|Chromium\/|Edg\/|OPR\//.test(navigator.userAgent);
}

export function ChromeNudge() {
  const { visible, dismiss } = useDismissableFlag(DISMISSED_KEY, () => !isChromium());
  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span aria-hidden>🌐</span>
      <span className="flex-1">
        SlideFORGE works best in <strong>Chrome</strong> (or another Chromium browser) — some
        features may be limited elsewhere.
      </span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={dismiss} aria-label="Dismiss">
        ×
      </Button>
    </div>
  );
}
