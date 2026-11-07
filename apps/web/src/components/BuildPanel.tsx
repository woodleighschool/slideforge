import {
  CheckCircle2Icon,
  FileArchiveIcon,
  FileCode2Icon,
  FolderOpenIcon,
  HammerIcon,
  ImageIcon,
  PresentationIcon,
  SearchIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import type { Builder } from "@/lib/useBuilder";
import { cn } from "@/lib/utils";

function isOutputFormat(value: unknown): value is "pptx" | "png" {
  return value === "pptx" || value === "png";
}

function StepHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Badge variant="secondary" className="size-5 rounded-full p-0">
        {step}
      </Badge>
      <div className="flex flex-col gap-0.5">
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourceStatus({ status }: { status: Builder["resourceStatus"] }) {
  if (status.kind === "idle") return null;

  if (status.kind === "reading") {
    return (
      <Alert aria-live="polite">
        <Spinner />
        <AlertTitle>Reading resources</AlertTitle>
        <AlertDescription>{status.message}</AlertDescription>
      </Alert>
    );
  }

  const Icon = status.kind === "success" ? CheckCircle2Icon : XCircleIcon;

  return (
    <Alert variant={status.kind === "error" ? "destructive" : "success"} aria-live="polite">
      <Icon />
      <AlertTitle>
        {status.kind === "success" ? "Resources ready" : "Resources could not be read"}
      </AlertTitle>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  );
}

function SavedPageStatus({ status }: { status: Builder["savedPageStatus"] }) {
  if (status.kind === "idle") return null;

  if (status.kind === "reading") {
    return (
      <Alert aria-live="polite">
        <Spinner />
        <AlertTitle>Reading the saved page</AlertTitle>
      </Alert>
    );
  }

  if (status.kind === "error") {
    return (
      <Alert variant="destructive" aria-live="assertive">
        <XCircleIcon />
        <AlertTitle>Couldn't read that page</AlertTitle>
        <AlertDescription>{status.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="success" aria-live="polite">
      <CheckCircle2Icon />
      <AlertTitle>{status.fileName} ready</AlertTitle>
      <AlertDescription>
        Found {status.blockCount} piece{status.blockCount === 1 ? "" : "s"} of lesson content.
        Preview it below, or go ahead and forge.
      </AlertDescription>
    </Alert>
  );
}

function CompanionFolderStatus({ status }: { status: Builder["companionFolderStatus"] }) {
  if (status.kind === "idle") return null;

  if (status.kind === "reading") {
    return (
      <Alert aria-live="polite">
        <Spinner />
        <AlertTitle>Reading the folder</AlertTitle>
      </Alert>
    );
  }

  if (status.kind === "error") {
    return (
      <Alert variant="destructive" aria-live="assertive">
        <XCircleIcon />
        <AlertTitle>Couldn't read that folder</AlertTitle>
        <AlertDescription>{status.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="success" aria-live="polite">
      <CheckCircle2Icon />
      <AlertTitle>Legacy section content ready</AlertTitle>
      <AlertDescription>
        Found {status.fileCount} saved section{status.fileCount === 1 ? "" : "s"} in{" "}
        {status.folderName}.
      </AlertDescription>
    </Alert>
  );
}

export function BuildPanel({ builder }: { builder: Builder }) {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const savedPageInputRef = useRef<HTMLInputElement>(null);
  const companionFolderInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [savedPageDragOver, setSavedPageDragOver] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build your presentation</CardTitle>
        <CardDescription>
          Work through the five steps, then forge an editable PowerPoint.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <StepHeading step={1} title="Presentation name" description="Name your presentation" />
            <Input
              id="presentation-name"
              aria-label="Presentation name"
              placeholder="e.g. Lesson 6 — Understanding Scams"
              value={builder.presentationName}
              onChange={(event) => builder.setPresentationName(event.target.value)}
            />
          </Field>

          <Field>
            <StepHeading
              step={2}
              title="Resources"
              description="Select your subject's resources folder or ZIP — the one with every lesson's files"
            />
            <FieldDescription>
              The saved lesson page (step 3) only carries your resources' <em>file names</em>, not
              the files themselves. This is where SlideForge gets the actual bytes — to embed your
              images in the slides and attach your resource files. Skip it and the presentation
              still builds, but images and resources show as placeholders instead of the real thing.
            </FieldDescription>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-auto w-full flex-col border-dashed py-6 text-muted-foreground",
                dragOver && "border-primary bg-primary/5 text-foreground",
              )}
              onClick={() => zipInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files[0];
                if (file) void builder.handleZipFile(file);
              }}
            >
              <FileArchiveIcon />
              <span>
                <strong className="font-medium text-foreground">Choose a file</strong> or drag and
                drop a resources ZIP
              </span>
            </Button>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void builder.handleZipFile(file);
              }}
            />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full flex-col whitespace-normal py-4 text-center text-muted-foreground"
              onClick={() => folderInputRef.current?.click()}
            >
              <FolderOpenIcon />
              <span>
                Choose the exported resources folder —
                <strong className="ml-1 font-medium text-foreground">no zipping needed</strong>
              </span>
            </Button>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const files = event.target.files;
                if (files?.length) void builder.handleFolderFiles(files);
                event.target.value = "";
              }}
            />
            <ResourceStatus status={builder.resourceStatus} />

            {builder.lastZipInfo && (
              <Alert>
                <FileArchiveIcon />
                <AlertTitle>Use your last resources file?</AlertTitle>
                <AlertDescription className="flex flex-col gap-3">
                  <p>
                    {builder.lastZipInfo.name} ({formatBytes(builder.lastZipInfo.size)}) is stored
                    in this browser.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void builder.selectLastZip()}>
                      Use this file
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        builder.dismissLastZipSuggestion();
                        zipInputRef.current?.click();
                      }}
                    >
                      Choose a different file
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </Field>

          <Field>
            <StepHeading
              step={3}
              title="Lesson content"
              description="Upload the lesson page you saved from your browser"
            />
            <FieldDescription>
              Open the lesson in Seqta's{" "}
              <strong className="font-medium text-foreground">editor</strong> view (not the
              student/parent preview), then save the whole page: Cmd/Ctrl+S in Chrome, choosing
              "Webpage, HTML only". Upload that file here — SlideForge reads the lesson's titles,
              text, and resources straight out of it to build the presentation.
            </FieldDescription>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-auto w-full flex-col whitespace-normal border-dashed py-6 text-center text-muted-foreground",
                savedPageDragOver && "border-primary bg-primary/5 text-foreground",
              )}
              onClick={() => savedPageInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setSavedPageDragOver(true);
              }}
              onDragLeave={() => setSavedPageDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setSavedPageDragOver(false);
                const file = event.dataTransfer.files[0];
                if (file) void builder.handleSavedPageFile(file);
              }}
            >
              <FileCode2Icon />
              <span>
                <strong className="font-medium text-foreground">Choose the file</strong> — e.g.
                "Lesson 6 SEQTA.html" — or drag and drop it
              </span>
            </Button>
            <input
              ref={savedPageInputRef}
              type="file"
              accept=".html,.htm,text/html"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void builder.handleSavedPageFile(file);
                event.target.value = "";
              }}
            />
            <SavedPageStatus status={builder.savedPageStatus} />

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              optional
              <span className="h-px flex-1 bg-border" />
            </div>

            <p className="text-sm font-semibold">Also add that page's "..._files" folder</p>
            <FieldDescription>
              Chrome saves this automatically, right next to the lesson page, every time you save it
              — nothing extra to export. Add it too and any Legacy editor sections recover their
              real text, images, and resources instead of appearing as a blank gap. This only works
              from the <strong className="font-medium text-foreground">editor</strong> view's save —
              the student/parent preview's version is missing what's needed to match its images and
              resources.
            </FieldDescription>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full flex-col whitespace-normal py-4 text-center text-muted-foreground"
              onClick={() => companionFolderInputRef.current?.click()}
            >
              <FolderOpenIcon />
              <span>
                <strong className="font-medium text-foreground">Choose the folder</strong> — e.g.
                "Lesson 6 SEQTA_files"
              </span>
            </Button>
            <input
              ref={companionFolderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const files = event.target.files;
                if (files?.length) void builder.handleCompanionFolderFiles(files);
                event.target.value = "";
              }}
            />
            <CompanionFolderStatus status={builder.companionFolderStatus} />

            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={!builder.savedPageHTML}
              onClick={builder.openPreview}
            >
              <SearchIcon data-icon="inline-start" />
              Preview parsed content
            </Button>
          </Field>

          <FieldSet>
            <FieldLegend className="flex items-start gap-2">
              <Badge variant="secondary" className="size-5 rounded-full p-0">
                4
              </Badge>
              <span>Choose output</span>
            </FieldLegend>
            <FieldDescription>PowerPoint or lesson pages</FieldDescription>
            <RadioGroup
              value={builder.outputFormat}
              onValueChange={(value) => {
                if (isOutputFormat(value)) builder.setOutputFormat(value);
              }}
              className="grid-cols-1 sm:grid-cols-2"
            >
              <FieldLabel>
                <Field orientation="horizontal">
                  <RadioGroupItem value="pptx" />
                  <PresentationIcon />
                  <FieldContent>
                    <FieldTitle>PowerPoint</FieldTitle>
                    <FieldDescription>Editable .pptx presentation</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel data-disabled="true">
                <Field orientation="horizontal" data-disabled="true">
                  <RadioGroupItem value="png" disabled />
                  <ImageIcon />
                  <FieldContent>
                    <FieldTitle className="flex items-center gap-2">
                      Lesson pages <Badge variant="outline">Coming soon</Badge>
                    </FieldTitle>
                    <FieldDescription>Individual .png images</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </RadioGroup>
          </FieldSet>

          <Field>
            <StepHeading
              step={5}
              title="Forge presentation"
              description="Build and download the presentation"
            />
            <Button
              className="w-full"
              disabled={builder.forgeState.kind === "forging"}
              onClick={builder.forge}
            >
              {builder.forgeState.kind === "forging" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HammerIcon data-icon="inline-start" />
              )}
              {builder.forgeState.kind === "forging" ? "Forging…" : "Forge presentation"}
            </Button>

            {builder.forgeState.kind === "forging" && (
              <Alert aria-live="polite">
                <FileCode2Icon />
                <AlertTitle>Building your presentation</AlertTitle>
                <AlertDescription>{builder.forgeState.message}</AlertDescription>
              </Alert>
            )}

            {builder.forgeState.kind === "success" && (
              <Alert variant="success" aria-live="polite">
                <CheckCircle2Icon />
                <AlertTitle>Your presentation is ready</AlertTitle>
                <AlertDescription>
                  It has been downloaded to your browser. Open the PowerPoint and review it before
                  sharing.
                </AlertDescription>
              </Alert>
            )}

            {builder.forgeState.kind === "error" && (
              <Alert variant="destructive" aria-live="assertive">
                <TriangleAlertIcon />
                <AlertTitle>Presentation could not be built</AlertTitle>
                <AlertDescription>{builder.forgeState.message}</AlertDescription>
              </Alert>
            )}
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
