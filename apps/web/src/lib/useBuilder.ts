import {
  buildGenerationInput,
  generatePptx,
  importResourceFolder,
  importResourceZip,
  parseLessonHTML,
} from "@slideforge/core";
import type { LessonBlock, ResourceMap } from "@slideforge/core";
import { useEffect, useState } from "react";

import { loadLastResourceZip, saveLastResourceZip, type LastResourceZip } from "@/lib/idbStore";

type ResourceStatusKind = "success" | "warning" | "error" | null;

export function useBuilder() {
  const [presentationName, setPresentationName] = useState("");

  const [resources, setResources] = useState<ResourceMap | null>(null);
  const [resourceStatusText, setResourceStatusText] = useState("");
  const [resourceStatusKind, setResourceStatusKind] = useState<ResourceStatusKind>(null);
  const [lastZipInfo, setLastZipInfo] = useState<LastResourceZip | null>(null);

  const [lessonHTML, setLessonHTML] = useState("");

  const [outputFormat, setOutputFormat] = useState<"pptx" | "png">("pptx");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState<LessonBlock[]>([]);

  const [forging, setForging] = useState(false);
  const [forgeMessage, setForgeMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipJarVisible, setTipJarVisible] = useState(false);

  useEffect(() => {
    void (async () => {
      const last = await loadLastResourceZip();
      if (last?.blob) setLastZipInfo(last);
    })();
  }, []);

  async function handleZipFile(file: File) {
    setLastZipInfo(null);
    setResourceStatusKind(null);
    setResourceStatusText("Reading zip…");

    try {
      const result = await importResourceZip(file);
      setResources(result.resources);
      setResourceStatusText(
        result.isComplete
          ? `Loaded ${result.extractedFileCount} resource${result.extractedFileCount === 1 ? "" : "s"} from ${file.name}`
          : `Loaded ${result.extractedFileCount}/${result.expectedFileCount} resources — the zip may be incomplete`,
      );
      setResourceStatusKind(result.isComplete ? "success" : "warning");
      await saveLastResourceZip(file);
    } catch (err) {
      setResourceStatusText(
        `Couldn't read this zip: ${err instanceof Error ? err.message : String(err)}`,
      );
      setResourceStatusKind("error");
      setResources(null);
    }
  }

  /** The exported Seqta resources folder, selected directly — no zip step. */
  async function handleFolderFiles(fileList: FileList) {
    setLastZipInfo(null);
    setResourceStatusKind(null);
    setResourceStatusText("Reading folder…");

    const files = Array.from(fileList);
    const folderName = files[0]?.webkitRelativePath.split("/")[0] ?? "the selected folder";

    try {
      const result = await importResourceFolder(files);
      setResources(result.resources);
      setResourceStatusText(
        result.isComplete
          ? `Loaded ${result.extractedFileCount} resource${result.extractedFileCount === 1 ? "" : "s"} from ${folderName}`
          : `Loaded ${result.extractedFileCount}/${result.expectedFileCount} resources — the folder may be incomplete`,
      );
      setResourceStatusKind(result.isComplete ? "success" : "warning");
    } catch (err) {
      setResourceStatusText(
        `Couldn't read this folder: ${err instanceof Error ? err.message : String(err)}`,
      );
      setResourceStatusKind("error");
      setResources(null);
    }
  }

  async function useLastZip() {
    if (!lastZipInfo) return;
    setLastZipInfo(null);
    const file = new File([lastZipInfo.blob], lastZipInfo.name, {
      lastModified: lastZipInfo.lastModified,
    });
    await handleZipFile(file);
  }

  function dismissLastZipSuggestion() {
    setLastZipInfo(null);
  }

  function openPreview() {
    setPreviewBlocks(lessonHTML.trim() ? parseLessonHTML(lessonHTML) : []);
    setPreviewOpen(true);
  }

  async function forge() {
    setError(null);
    setDone(false);

    if (!lessonHTML.trim()) {
      setError("Paste your lesson HTML before forging.");
      return;
    }

    setForging(true);
    setForgeMessage("Forging your presentation…");

    try {
      const input = buildGenerationInput({
        presentationName,
        lessonHTML,
        resources: resources ?? new Map(),
      });

      if (input.unmatchedImages.length > 0) {
        setForgeMessage(
          `Forging… (${input.unmatchedImages.length} image${input.unmatchedImages.length === 1 ? "" : "s"} couldn't be matched — they'll show as a placeholder)`,
        );
      }

      await generatePptx(input);

      setDone(true);
      setTipJarVisible(true);
    } catch (err) {
      setError(`Forging failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setForging(false);
    }
  }

  return {
    presentationName,
    setPresentationName,
    resources,
    resourceStatusText,
    resourceStatusKind,
    lastZipInfo,
    lessonHTML,
    setLessonHTML,
    outputFormat,
    setOutputFormat,
    previewOpen,
    setPreviewOpen,
    previewBlocks,
    forging,
    forgeMessage,
    done,
    error,
    tipJarVisible,
    dismissTipJar: () => setTipJarVisible(false),
    handleZipFile,
    handleFolderFiles,
    useLastZip,
    dismissLastZipSuggestion,
    openPreview,
    forge,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
