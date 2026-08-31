import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDismissableFlag } from "@/lib/useDismissableFlag";

const TERMS_KEY = "slideforge.termsAccepted.v1";
const YEAR = new Date().getFullYear();

export function TermsGate() {
  const { visible, dismiss } = useDismissableFlag(TERMS_KEY, () => true);
  const [checked, setChecked] = useState(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-navy">Welcome to SlideFORGE</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please read and accept before you start forging.
        </p>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            <strong>Everything stays on your device.</strong> Your lesson HTML and resources zip
            are read and processed entirely inside this browser tab. Nothing is uploaded to a
            server — the finished .pptx is generated locally and handed straight to your
            browser&apos;s normal download.
          </p>
          <p>
            <strong>What SlideFORGE does.</strong> It applies a fixed, deterministic set of layout
            rules to turn Seqta lesson content into slides — there&apos;s no AI involved, and it
            won&apos;t make per-lesson design judgment calls. Always give the output a quick look
            before sharing it with students.
          </p>
          <p>
            <strong>No warranty.</strong> SlideFORGE is provided as-is, free to use, with no
            guarantee it will suit every lesson format. You&apos;re responsible for reviewing
            anything it generates.
          </p>
          <p>
            <strong>Ownership.</strong> © {YEAR} M Scott. All rights reserved. This tool and its
            source are not to be copied, redistributed, or repackaged without permission.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <Checkbox
            id="terms-checkbox"
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
          />
          <label htmlFor="terms-checkbox">I&apos;ve read and accept these terms.</label>
        </div>

        <Button className="mt-4 w-full" disabled={!checked} onClick={dismiss}>
          I Agree &amp; Continue
        </Button>
      </div>
    </div>
  );
}
