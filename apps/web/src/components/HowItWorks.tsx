import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Row({
  step,
  title,
  sub,
  trailing,
}: {
  step: number;
  title: string;
  sub: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="shrink-0 text-sm text-muted-foreground">{trailing}</div>
    </div>
  );
}

export function HowItWorks({
  presentationName,
  hasZip,
  hasHtml,
  outputFormat,
  ready,
}: {
  presentationName: string;
  hasZip: boolean;
  hasHtml: boolean;
  outputFormat: "pptx" | "png";
  ready: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🔨 How it works</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <Row
          step={1}
          title="Presentation Name"
          sub="Name your presentation"
          trailing={presentationName.trim() || "Lesson 6"}
        />
        <Row step={2} title="Resources" sub="Select the resources ZIP" trailing={hasZip ? "✅" : "📁"} />
        <Row
          step={3}
          title="Paste Lesson HTML"
          sub="Paste the lesson HTML you copied"
          trailing={hasHtml ? "✅" : "</>"}
        />
        <Row
          step={4}
          title="Choose Output"
          sub="PowerPoint or Lesson Pages"
          trailing={
            <span className="space-x-1">
              <span className={cn(outputFormat !== "pptx" && "opacity-30")}>📊</span>
              <span className={cn(outputFormat !== "png" && "opacity-30")}>🖼️</span>
            </span>
          }
        />
        <Row step={5} title="Forge Presentation" sub="Click and let SlideFORGE build it" trailing="🔨" />

        {ready && (
          <div className="flex items-center gap-3 pt-3">
            <span aria-hidden>✅</span>
            <div>
              <div className="text-sm font-semibold text-foreground">Your Presentation is Ready!</div>
              <div className="text-xs text-muted-foreground">Open your .pptx file and give it a look.</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
