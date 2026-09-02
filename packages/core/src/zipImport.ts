// Reads the teacher's resources zip entirely in memory (via JSZip) instead of
// extracting to disk. Nothing here ever leaves the browser tab.
//
// - strips __MACOSX/ metadata entries and directory entries
// - strips a single top-level wrapper folder, if the whole zip is wrapped in
//   one (e.g. exports that wrap everything in "Resources/" or a
//   randomly-named top folder)
//
import JSZip from "jszip";

import {
  blobToDataURL,
  detectWrapperFolder,
  isMetadataPath,
  stripWrapper,
} from "./resourceImportUtils.js";
import type { ImportedResources, ResourceEntry } from "./types.js";

export async function importResourceZip(zipFile: File | Blob): Promise<ImportedResources> {
  const zip = await JSZip.loadAsync(zipFile);

  const realEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && !isMetadataPath(entry.name),
  );
  const wrapperPrefix = detectWrapperFolder(realEntries.map((e) => e.name));

  const resources = new Map<string, ResourceEntry>();

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
  }

  return {
    resources,
    fileCount: resources.size,
  };
}
