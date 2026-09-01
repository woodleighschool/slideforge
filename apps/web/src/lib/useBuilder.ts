import {
  buildGenerationInput,
  importResourceFolder,
  importResourceZip,
  parseLessonHTML,
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
    handleZipFile,
    handleFolderFiles,
    selectLastZip,
    dismissLastZipSuggestion: () => setLastZipInfo(null),
    openPreview,
    forge,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
