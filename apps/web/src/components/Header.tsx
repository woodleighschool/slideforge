import { ForgeIcon } from "@/components/ForgeIcon";

export function Header() {
  return (
    <header className="flex items-center gap-4">
      <ForgeIcon className="h-16 w-16 shrink-0" />
      <div>
        <div className="text-2xl font-extrabold tracking-tight">
          <span className="text-foreground">Slide</span>
          <span className="text-forge-orange">FORGE</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Seqta lesson HTML → editable PowerPoint, right in your browser.
        </div>
      </div>
    </header>
  );
}
