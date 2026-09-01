import {
  CheckIcon,
  FileArchiveIcon,
  FileCode2Icon,
  HammerIcon,
  ImageIcon,
  PresentationIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Row({
  step,
  title,
  description,
  trailing,
}: {
  step: number;
  title: string;
  description: string;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Badge variant="secondary" className="size-6 rounded-full p-0">
        {step}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="shrink-0 text-muted-foreground">{trailing}</div>
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
    <Card className="self-start">
      <CardHeader>
        <CardTitle>How it works</CardTitle>
        <CardDescription>Your presentation takes shape as you complete each step.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <Row
          step={1}
          title="Presentation name"
          description="Name your presentation"
          trailing={presentationName.trim() || "Lesson 6"}
        />
        <Row
          step={2}
          title="Resources"
          description="Select the resources ZIP"
          trailing={
            hasZip ? (
              <CheckIcon className="size-4 text-success" />
            ) : (
              <FileArchiveIcon className="size-4" />
            )
          }
        />
        <Row
          step={3}
          title="Paste lesson HTML"
          description="Paste the lesson HTML you copied"
          trailing={
            hasHtml ? (
              <CheckIcon className="size-4 text-success" />
            ) : (
              <FileCode2Icon className="size-4" />
            )
          }
        />
        <Row
          step={4}
          title="Choose output"
          description="PowerPoint or lesson pages"
          trailing={
            <span className="flex gap-1">
              <PresentationIcon className={cn("size-4", outputFormat !== "pptx" && "opacity-30")} />
              <ImageIcon className={cn("size-4", outputFormat !== "png" && "opacity-30")} />
            </span>
          }
        />
        <Row
          step={5}
          title="Forge presentation"
          description="Build and download it"
          trailing={<HammerIcon className="size-4" />}
        />

        {ready && (
          <div className="flex items-center gap-3 pt-4">
            <CheckIcon className="size-4 text-success" />
            <div>
              <div className="text-sm font-medium">Your presentation is ready</div>
              <div className="text-xs text-muted-foreground">
                Open the PowerPoint and review it.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
