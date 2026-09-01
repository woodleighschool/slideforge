import { blockMeta, type LessonBlock } from "@slideforge/core";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pr-10">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Parsed content</DialogTitle>
            <Badge variant="secondary">
              {blocks.length} block{blocks.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <DialogDescription>
            This is the ordered content SlideFORGE will use to build the presentation.
          </DialogDescription>
        </DialogHeader>

        {blocks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Paste lesson HTML to see it broken down here.
          </p>
        ) : (
          <ul className="divide-y">
            {blocks.map((block, index) => {
              const meta = blockMeta(block);
              return (
                <li key={`${meta.label}-${index}`} className="py-3">
                  <Badge variant="outline">{meta.label}</Badge>
                  <div className="mt-1 truncate text-sm">{meta.summary}</div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
