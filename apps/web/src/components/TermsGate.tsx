import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { useDismissableFlag } from "@/lib/useDismissableFlag";

const TERMS_KEY = "slideforge.termsAccepted.v1";
const YEAR = new Date().getFullYear();

export function TermsGate() {
  const { visible, dismiss } = useDismissableFlag(TERMS_KEY, () => true);
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={visible}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to SlideFORGE</DialogTitle>
          <DialogDescription>
            Please read and accept these terms before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <p>
            <strong>Everything stays in your browser.</strong> Your lesson HTML and resources are
            processed locally and are never uploaded. Your last resources ZIP may be stored by this
            browser so you can reuse it later.
          </p>
          <p>
            <strong>What SlideFORGE does.</strong> It applies fixed, deterministic layout rules to
            turn Seqta lesson content into slides. There is no AI involved, and it does not make
            per-lesson design decisions. Review the output before sharing it with students.
          </p>
          <p>
            <strong>No warranty.</strong> SlideFORGE is provided as-is, without a guarantee that it
            will suit every lesson format. You are responsible for reviewing anything it generates.
          </p>
          <p>
            <strong>Ownership.</strong> © {YEAR} Woodleigh School. All rights reserved.
          </p>
        </div>

        <Field orientation="horizontal">
          <Checkbox id="terms-checkbox" checked={checked} onCheckedChange={setChecked} />
          <FieldLabel htmlFor="terms-checkbox">I have read and accept these terms.</FieldLabel>
        </Field>

        <DialogFooter>
          <Button className="w-full sm:w-auto" disabled={!checked} onClick={dismiss}>
            Agree and continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
