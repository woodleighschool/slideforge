export function isMetadataPath(path: string): boolean {
  return path.split("/").some((segment) => segment === "__MACOSX" || segment.startsWith("."));
}

export function detectWrapperFolder(paths: string[]): string | null {
  if (paths.length === 0) return null;

  const firstTop = paths[0]?.split("/")[0];
  if (!firstTop || !paths.every((path) => path.split("/")[0] === firstTop)) return null;
  return firstTop;
}

export function stripWrapper(path: string, wrapperPrefix: string | null): string {
  if (!wrapperPrefix) return path;

  const prefix = `${wrapperPrefix}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The selected resource could not be read."));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
