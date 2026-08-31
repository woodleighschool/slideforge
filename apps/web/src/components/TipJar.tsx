import { Button } from "@/components/ui/button";

export function TipJar({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-gold/10 px-4 py-3 text-sm text-navy">
      <span aria-hidden>🍇</span>
      <span className="flex-1">
        Presentation forged! If SlideFORGE saved you some time, shout Scotty a grape juice 🍷 next
        time you see him.
      </span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss} aria-label="Dismiss">
        ×
      </Button>
    </div>
  );
}
