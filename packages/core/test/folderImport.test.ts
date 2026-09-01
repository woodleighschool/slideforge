import { describe, expect, it } from "vitest";

import { importResourceFolder } from "../src/folderImport.js";

/** jsdom's File constructor doesn't set webkitRelativePath (that's populated
 * by the browser's own folder-picker) — build it as a real browser would.  */
function folderFile(relativePath: string, content = "x"): File {
  const name = relativePath.split("/").at(-1) ?? relativePath;
  const file = new File([content], name);
  Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
  return file;
}

describe("importResourceFolder", () => {
  it("reads files and keys them by lowercased relative path", async () => {
    const result = await importResourceFolder([
      folderFile("9 Commerce Resources/diagram.png"),
      folderFile("9 Commerce Resources/Handout.PDF"),
    ]);

    expect(result.isComplete).toBe(true);
    expect(result.extractedFileCount).toBe(2);
    expect([...result.resources.keys()]).toEqual(["diagram.png", "handout.pdf"]);
    expect(result.resources.get("handout.pdf")?.relativePath).toBe("Handout.PDF");
  });

  it("strips a single shared top-level wrapper folder", async () => {
    const result = await importResourceFolder([
      folderFile("Export/sub/notes.txt"),
      folderFile("Export/image.png"),
    ]);

    expect([...result.resources.keys()].sort()).toEqual(["image.png", "sub/notes.txt"]);
  });

  it("skips macOS and dotfile metadata", async () => {
    const result = await importResourceFolder([
      folderFile("Export/__MACOSX/._image.png"),
      folderFile("Export/.DS_Store"),
      folderFile("Export/image.png"),
    ]);

    expect(result.extractedFileCount).toBe(1);
    expect([...result.resources.keys()]).toEqual(["image.png"]);
  });

  it("handles an empty selection", async () => {
    const result = await importResourceFolder([]);

    expect(result.isComplete).toBe(true);
    expect(result.extractedFileCount).toBe(0);
    expect(result.resources.size).toBe(0);
  });
});
