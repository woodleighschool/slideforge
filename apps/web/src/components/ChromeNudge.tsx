import { XIcon } from "lucide-react";
import { siGooglechrome } from "simple-icons";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDismissableFlag } from "@/lib/useDismissableFlag";

const DISMISSED_KEY = "slideforge.chromeNudgeDismissed.v1";

function isChromium(): boolean {
  return /Chrome\/|Chromium\/|Edg\/|OPR\//.test(navigator.userAgent);
}

export function ChromeNudge() {
  const { visible, dismiss } = useDismissableFlag(DISMISSED_KEY, () => !isChromium());
  if (!visible) return null;

  return (
    <Alert>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill={`#${siGooglechrome.hex}`}>
        <path d={siGooglechrome.path} />
      </svg>
      <AlertTitle>SlideFORGE works best in Google Chrome</AlertTitle>
      <AlertDescription>Some features may be limited elsewhere.</AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label="Dismiss browser advice"
        >
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
