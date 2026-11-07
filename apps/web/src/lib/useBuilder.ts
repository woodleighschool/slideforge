import {
  buildGenerationInput,
  buildResourcesOnlyBundle,
  importResourceFolder,
  importResourceZip,
  matchSavedPageResources,
  parseLessonHTML,
} from "@slideforge/core";
import type { LessonBlock, ResourceMap } from "@slideforge/core";
import { useEffect, useState } from "react";

import { downloadBytes } from "@/lib/downloadBytes";
import { loadLastResourceZip, saveLastResourceZip, type LastResourceZip } from "@/lib/idbStore";

export type ResourceStatus =
  | { kind: "idle" }
  | { kind: "reading"; message: string }
  | { kind: "success" | "error"; message: string };

export type ForgeState =
  | { kind: "idle" }
  | { kind: "forging"; message: string }
  | { kind: "success" }
  | { kind: "error"; message: string };

export type SavedPageStatus =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "success"; matchedCount: number; unmatchedFilenames: string[] }
  | { kind: "error"; message: string };

export function useBuilder() {
  const [presentationName, setPresentationName] = useState("");
  const [resources, setResources] = useState<ResourceMap | null>(null);
  const [resourceStatus, setResourceStatus] = useState<ResourceStatus>({ kind: "idle" });
  const [lastZipInfo, setLastZipInfo] = useState<LastResourceZip | null>(null);
  const [lessonHTML, setLessonHTML] = useState("");
  const [outputFormat, setOutputFormat] = useState<"pptx" | "png">("pptx");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState<LessonBlock[]>([]);
  const [forgeState, setForgeState] = useState<ForgeState>({ kind: "idle" });
  const [savedPageStatus, setSavedPageStatus] = useState<SavedPageStatus>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function restoreLastZip() {
      const lastZip = await loadLastResourceZip();
      if (!cancelled && lastZip) setLastZipInfo(lastZip);
    }

    void restoreLastZip();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleZipFile(file: File) {
    setLastZipInfo(null);
    setResourceStatus({ kind: "reading", message: `Reading ${file.name}…` });

    try {
      const result = await importResourceZip(file);
      setResources(result.resources);
      setResourceStatus({
        kind: "success",
        message: `Loaded ${result.fileCount} resource${result.fileCount === 1 ? "" : "s"} from ${file.name}.`,
      });

      try {
        await saveLastResourceZip(file);
      } catch {
        // The selected resources remain usable when browser persistence is unavailable.
      }
    } catch (error) {
      setResources(null);
      setResourceStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function handleFolderFiles(fileList: FileList) {
    const files = Array.from(fileList);
    const folderName = files[0]?.webkitRelativePath.split("/")[0] || "selected folder";

    setLastZipInfo(null);
    setResourceStatus({ kind: "reading", message: `Reading ${folderName}…` });

    try {
      const result = await importResourceFolder(files);
      setResources(result.resources);
      setResourceStatus({
        kind: "success",
        message: `Loaded ${result.fileCount} resource${result.fileCount === 1 ? "" : "s"} from ${folderName}.`,
      });
    } catch (error) {
      setResources(null);
      setResourceStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function selectLastZip() {
    if (!lastZipInfo) return;

    const file = new File([lastZipInfo.blob], lastZipInfo.name, {
      lastModified: lastZipInfo.lastModified,
    });
    setLastZipInfo(null);
    await handleZipFile(file);
  }

  function openPreview() {
    setPreviewBlocks(lessonHTML.trim() ? parseLessonHTML(lessonHTML) : []);
    setPreviewOpen(true);
  }

  /** Separate from the paste-and-forge flow above: a saved lesson page is
   * the whole Seqta app shell, not lesson content, so it's never run
   * through buildGenerationInput/parseLessonHTML — this only ever looks
   * for the Resources block and downloads the matched files, never a
   * slide. */
  async function matchSavedPageFile(file: File) {
    if (!resources) {
      setSavedPageStatus({
        kind: "error",
        message: "Load a resources folder or ZIP in step 2 first.",
      });
      return;
    }

    setSavedPageStatus({ kind: "reading" });

    try {
      const html = await file.text();
      const { matched, unmatchedFilenames } = matchSavedPageResources(html, resources);

      if (matched.length === 0 && unmatchedFilenames.length === 0) {
        setSavedPageStatus({
          kind: "error",
          message: "No Resources section was found in that saved page.",
        });
        return;
      }

      if (matched.length > 0) {
        const outputName = presentationName.trim() || "Resources";
        const bundle = await buildResourcesOnlyBundle(outputName, matched);
        downloadBytes(bundle.bytes, bundle.fileName, "application/zip");
      }

      setSavedPageStatus({ kind: "success", matchedCount: matched.length, unmatchedFilenames });
    } catch (error) {
      setSavedPageStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function forge() {
    if (!lessonHTML.trim()) {
      setForgeState({ kind: "error", message: "Paste your lesson HTML before forging." });
      return;
    }

    setForgeState({ kind: "forging", message: "Assembling slides…" });

    try {
      const input = buildGenerationInput({
        presentationName,
        lessonHTML,
        resources: resources ?? new Map(),
      });

      if (input.unmatchedImages.length > 0) {
        setForgeState({
          kind: "forging",
          message: `${input.unmatchedImages.length} image${input.unmatchedImages.length === 1 ? "" : "s"} could not be matched and will use a placeholder.`,
        });
      } else if (input.unmatchedResources.length > 0) {
        setForgeState({
          kind: "forging",
          message: `${input.unmatchedResources.length} resource${input.unmatchedResources.length === 1 ? "" : "s"} could not be matched and will need to be attached manually.`,
        });
      }

      const { generatePptx } = await import("@slideforge/core/generate");
      await generatePptx(input);
      setForgeState({ kind: "success" });
    } catch (error) {
      setForgeState({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    presentationName,
    setPresentationName,
    resources,
    resourceStatus,
    lastZipInfo,
    lessonHTML,
    setLessonHTML,
    outputFormat,
    setOutputFormat,
    previewOpen,
    setPreviewOpen,
    previewBlocks,
    forgeState,
    savedPageStatus,
    handleZipFile,
    handleFolderFiles,
    selectLastZip,
    dismissLastZipSuggestion: () => setLastZipInfo(null),
    openPreview,
    matchSavedPageFile,
    forge,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
