const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto border-t py-6 text-center text-xs text-muted-foreground">
      © {YEAR} Woodleigh School · Lesson content stays in your browser and is never uploaded.
    </footer>
  );
}
