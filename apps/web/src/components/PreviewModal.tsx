import { blockMeta, type LessonBlock } from "@slideforge/core";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PreviewModal({
  open,
  onOpenChange,
  blocks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: LessonBlock[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Parsed Content</span>
            <span className="text-sm font-normal text-muted-foreground">
              {blocks.length} block{blocks.length === 1 ? "" : "s"}
            </span>
          </DialogTitle>
        </DialogHeader>

        {blocks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Paste lesson HTML above to see it broken down here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {blocks.map((block, index) => {
              const meta = blockMeta(block);
              return (
                <li key={index} className="py-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-forge-orange">
                    {meta.label}
                  </div>
                  <div className="truncate text-sm text-foreground">{meta.summary}</div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
