// Reads the teacher's resources zip entirely in memory (via JSZip) instead of
// extracting to disk. Nothing here ever leaves the browser tab.
//
// - strips __MACOSX/ metadata entries and directory entries
// - strips a single top-level wrapper folder, if the whole zip is wrapped in
//   one (e.g. exports that wrap everything in "Resources/" or a
//   randomly-named top folder)
//
// A completeness check (extracted count vs. archive entry count) is kept too
// — a mismatched count is a useful signal that something in the zip couldn't
// be read.

import JSZip from "jszip";

import { detectWrapperFolder, stripWrapper } from "./pathUtils.js";
import type { ImportedResources, ResourceEntry } from "./types.js";

export async function importResourceZip(zipFile: File | Blob): Promise<ImportedResources> {
  const zip = await JSZip.loadAsync(zipFile);

  const realEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && !entry.name.startsWith("__MACOSX/"),
  );
  const expectedFileCount = realEntries.length;

  const wrapperPrefix = detectWrapperFolder(realEntries.map((e) => e.name));

  const resources = new Map<string, ResourceEntry>();
  let extractedCount = 0;

  for (const entry of realEntries) {
    const relativePath = stripWrapper(entry.name, wrapperPrefix);
    if (!relativePath) continue;

    const blob = await entry.async("blob");
    const dataUrl = await blobToDataURL(blob);

    resources.set(relativePath.toLowerCase(), {
      relativePath,
      blob,
      dataUrl,
      bytes: blob.size,
    });
    extractedCount += 1;
  }

  return {
    resources,
    extractedFileCount: extractedCount,
    expectedFileCount,
    isComplete: extractedCount === expectedFileCount,
  };
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
