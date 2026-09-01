// Reads resources directly from a folder the teacher selects (a
// <input webkitdirectory> picker in the browser), instead of requiring them
// to zip the exported folder first. Mirrors importResourceZip's behavior as
// closely as the browser's folder APIs allow: skips OS/editor metadata files
// and strips a single shared top-level wrapper folder, so the same
// ResourceMap shape comes out regardless of which path a teacher used.

import { detectWrapperFolder, stripWrapper } from "./pathUtils.js";
import type { ImportedResources, ResourceEntry } from "./types.js";

/** True for OS/editor metadata that can end up inside a selected folder but
 * was never a real lesson resource (macOS' __MACOSX/.DS_Store, dotfiles). */
function isMetadataPath(relPath: string): boolean {
  return relPath.split("/").some((segment) => segment === "__MACOSX" || segment.startsWith("."));
}

export async function importResourceFolder(files: File[]): Promise<ImportedResources> {
  const realFiles = files.filter((file) => !isMetadataPath(file.webkitRelativePath || file.name));
  const expectedFileCount = realFiles.length;

  const paths = realFiles.map((file) => file.webkitRelativePath || file.name);
  const wrapperPrefix = detectWrapperFolder(paths);

  const resources = new Map<string, ResourceEntry>();
  let extractedCount = 0;

  for (const file of realFiles) {
    const rawPath = file.webkitRelativePath || file.name;
    const relativePath = stripWrapper(rawPath, wrapperPrefix);
    if (!relativePath) continue;

    const dataUrl = await fileToDataURL(file);

    resources.set(relativePath.toLowerCase(), {
      relativePath,
      blob: file,
      dataUrl,
      bytes: file.size,
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

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
