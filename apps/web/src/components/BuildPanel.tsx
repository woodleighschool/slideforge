import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Builder } from "@/lib/useBuilder";
import { cn } from "@/lib/utils";

function isOutputFormat(value: string): value is "pptx" | "png" {
  return value === "pptx" || value === "png";
}

function StepLabel({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forge-orange text-xs font-bold text-white">
          {n}
        </span>
        {title}
      </div>
      <div className="ml-7 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BuildPanel({ builder }: { builder: Builder }) {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔨 Build Your Presentation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <StepLabel n={1} title="Presentation Name" sub="Name your presentation" />
          <Input
            placeholder="e.g. Lesson 6 — Understanding Scams"
            value={builder.presentationName}
            onChange={(e) => builder.setPresentationName(e.target.value)}
          />
        </div>

        <div>
          <StepLabel n={2} title="Resources" sub="(Linked to the HTML code) Select the resources ZIP" />
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void builder.handleZipFile(file);
            }}
            className={cn(
              "w-full rounded-lg border-2 border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors",
              dragOver && "border-forge-orange bg-forge-orange/5",
            )}
          >
            <strong className="text-foreground">Click to choose</strong> or drag &amp; drop your
            resources .zip here
          </button>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void builder.handleZipFile(file);
            }}
          />
          {builder.zipStatusText && (
            <p
              className={cn(
                "mt-2 text-xs",
                builder.zipStatusKind === "success" && "text-emerald-600",
                builder.zipStatusKind === "warning" && "text-amber-600",
                builder.zipStatusKind === "error" && "text-destructive",
              )}
            >
              {builder.zipStatusText}
            </p>
          )}

          {builder.lastZipInfo && (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm">
                Found your last resources file — <strong>{builder.lastZipInfo.name}</strong> (
                {formatBytes(builder.lastZipInfo.size)}). Do you want to select a different
                resources file?
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={builder.useLastZip}>
                  No, Use This File
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    builder.dismissLastZipSuggestion();
                    zipInputRef.current?.click();
                  }}
                >
                  Yes, Choose Different File
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <StepLabel n={3} title="Paste Lesson HTML" sub="Paste the lesson HTML you copied from your LMS" />
          <Textarea
            placeholder="Paste the raw lesson HTML here…"
            className="min-h-32 font-mono text-xs"
            value={builder.lessonHTML}
            onChange={(e) => builder.setLessonHTML(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={!builder.lessonHTML.trim()}
            onClick={builder.openPreview}
          >
            Preview Parsed Content
          </Button>
        </div>

        <div>
          <StepLabel n={4} title="Choose Output" sub="PowerPoint or Lesson Pages (Images)" />
          <RadioGroup
            value={builder.outputFormat}
            onValueChange={(value) => {
              if (isOutputFormat(value)) builder.setOutputFormat(value);
            }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            <Label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm",
                builder.outputFormat === "pptx" && "border-forge-orange bg-forge-orange/5",
              )}
            >
              <RadioGroupItem value="pptx" />
              📊 PowerPoint (.pptx)
            </Label>
            <Label
              title="Coming soon in the web version"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground opacity-60"
            >
              <RadioGroupItem value="png" disabled />
              🖼️ Lesson Pages (.png)
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">
                Coming soon
              </span>
            </Label>
          </RadioGroup>
        </div>

        <div>
          <StepLabel n={5} title="Forge Presentation" sub="Click and let SlideFORGE build your presentation" />
          <Button
            className="w-full bg-forge-orange text-white hover:bg-forge-orange/90"
            disabled={builder.forging}
            onClick={builder.forge}
          >
            🔨 Forge Presentation
          </Button>

          {builder.forging && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forge-orange border-t-transparent" />
              {builder.forgeMessage}
            </div>
          )}

          {builder.done && (
            <div className="mt-3 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <span aria-hidden>✅</span>
              <div>
                <strong>Your presentation is ready!</strong>
                <br />
                It&apos;s been downloaded to your browser&apos;s Downloads folder — open it and
                give it a look before sharing.
              </div>
            </div>
          )}

          {builder.error && (
            <div className="mt-3 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span aria-hidden>⚠️</span>
              <div>{builder.error}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
