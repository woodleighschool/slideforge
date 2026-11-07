import {
  buildGenerationInputFromSavedPage,
  extractLessonBlocksFromSavedPage,
  importResourceFolder,
  importResourceZip,
} from "@slideforge/core";
import type { LessonBlock, ResourceMap } from "@slideforge/core";
import { useEffect, useState } from "react";

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
  | { kind: "success"; fileName: string; blockCount: number }
  | { kind: "error"; message: string };

export function useBuilder() {
  const [presentationName, setPresentationName] = useState("");
  const [resources, setResources] = useState<ResourceMap | null>(null);
  const [resourceStatus, setResourceStatus] = useState<ResourceStatus>({ kind: "idle" });
  const [lastZipInfo, setLastZipInfo] = useState<LastResourceZip | null>(null);
  const [savedPageHTML, setSavedPageHTML] = useState("");
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
    setPreviewBlocks(savedPageHTML ? extractLessonBlocksFromSavedPage(savedPageHTML) : []);
    setPreviewOpen(true);
  }

  /** The saved lesson page is now the only source of lesson content — it
   * drives the whole build, not just the Resources section, so this reads
   * it once up front to confirm it actually has lesson modules in it. */
  async function handleSavedPageFile(file: File) {
    setSavedPageStatus({ kind: "reading" });

    try {
      const html = await file.text();
      const blocks = extractLessonBlocksFromSavedPage(html);

      if (blocks.length === 0) {
        setSavedPageHTML("");
        setSavedPageStatus({
          kind: "error",
          message:
            'No lesson content was found in that file. Make sure you saved the lesson page itself (in Chrome: Cmd/Ctrl+S, then "Webpage, HTML only"), not just its HTML source.',
        });
        return;
      }

      setSavedPageHTML(html);
      setSavedPageStatus({ kind: "success", fileName: file.name, blockCount: blocks.length });
    } catch (error) {
      setSavedPageHTML("");
      setSavedPageStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function forge() {
    if (!savedPageHTML) {
      setForgeState({ kind: "error", message: "Upload your saved lesson page before forging." });
      return;
    }

    setForgeState({ kind: "forging", message: "Assembling slides…" });

    try {
      const input = buildGenerationInputFromSavedPage({
        presentationName,
        savedPageHTML,
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
    savedPageHTML,
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
    handleSavedPageFile,
    forge,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
