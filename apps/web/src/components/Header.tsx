import { ForgeIcon } from "@/components/ForgeIcon";

export function Header() {
  return (
    <header className="flex items-center gap-4">
      <ForgeIcon className="size-14 shrink-0 sm:size-16" />
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Slide<span className="text-brand">FORGE</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Seqta lesson HTML to editable PowerPoint, right in your browser.
        </p>
      </div>
    </header>
  );
}
