const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      © {YEAR} M Scott · SlideFORGE runs entirely in your browser — nothing you paste or upload
      ever leaves this tab.
    </footer>
  );
}
