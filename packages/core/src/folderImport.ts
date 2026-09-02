import {
  blobToDataURL,
  detectWrapperFolder,
  isMetadataPath,
  stripWrapper,
} from "./resourceImportUtils.js";
import type { ImportedResources, ResourceEntry } from "./types.js";

export async function importResourceFolder(files: File[]): Promise<ImportedResources> {
  const realFiles = files.filter((file) => !isMetadataPath(file.webkitRelativePath || file.name));
  const wrapperPrefix = detectWrapperFolder(
    realFiles.map((file) => file.webkitRelativePath || file.name),
  );
  const resources = new Map<string, ResourceEntry>();

  for (const file of realFiles) {
    const relativePath = stripWrapper(file.webkitRelativePath || file.name, wrapperPrefix);
    if (!relativePath) continue;

    resources.set(relativePath.toLowerCase(), {
      relativePath,
      blob: file,
      dataUrl: await blobToDataURL(file),
      bytes: file.size,
    });
  }

  return { resources, fileCount: resources.size };
}
