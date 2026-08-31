// Minimal IndexedDB wrapper for "remember the last resources zip". A browser
// can't keep a live pointer to a file on disk, so this stores the zip's
// actual bytes (as a Blob) directly in the browser's local database. It
// stays on this device/browser only — nothing is uploaded anywhere,
// consistent with the rest of SlideFORGE's privacy model.

const DB_NAME = "slideforge";
const DB_VERSION = 1;
const STORE = "kv";
const LAST_ZIP_KEY = "lastResourceZip";

export interface LastResourceZip {
  name: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.addEventListener("upgradeneeded", () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    });
    req.addEventListener("success", () => resolve(req.result));
    req.addEventListener("error", () => reject(req.error));
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.addEventListener("complete", () => resolve());
    tx.addEventListener("error", () => reject(tx.error));
  });
}

/** The store only ever holds values this module itself wrote via idbSet, so
 * there's no independent schema to validate `req.result` against here. */
async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.addEventListener("success", () => {
      const value = req.result as unknown;
      // oxlint-disable-next-line no-unsafe-type-assertion -- generic KV get: this module is the only writer, see doc comment above
      resolve((value as T | undefined) ?? null);
    });
    req.addEventListener("error", () => reject(req.error));
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.addEventListener("complete", () => resolve());
    tx.addEventListener("error", () => reject(tx.error));
  });
}

export async function saveLastResourceZip(file: File): Promise<void> {
  await idbSet(LAST_ZIP_KEY, {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    blob: file,
  });
}

export async function loadLastResourceZip(): Promise<LastResourceZip | null> {
  try {
    return await idbGet<LastResourceZip>(LAST_ZIP_KEY);
  } catch {
    return null;
  }
}

export async function clearLastResourceZip(): Promise<void> {
  await idbDelete(LAST_ZIP_KEY);
}
