import { get, set } from "idb-keyval";

const LAST_ZIP_KEY = "slideforge.lastResourceZip.v1";

export interface LastResourceZip {
  name: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

function isLastResourceZip(value: unknown): value is LastResourceZip {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<LastResourceZip>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.lastModified === "number" &&
    candidate.blob instanceof Blob
  );
}

export async function saveLastResourceZip(file: File): Promise<void> {
  await set(LAST_ZIP_KEY, {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    blob: file,
  } satisfies LastResourceZip);
}

export async function loadLastResourceZip(): Promise<LastResourceZip | null> {
  try {
    const value: unknown = await get(LAST_ZIP_KEY);
    return isLastResourceZip(value) ? value : null;
  } catch {
    return null;
  }
}
