import { describe, expect, it } from "vitest";

import { importResourceFolder } from "../src/folderImport.js";

function folderFile(relativePath: string, content = "synthetic content"): File {
  const name = relativePath.split("/").at(-1) ?? relativePath;
  const file = new File([content], name);
  Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
  return file;
}

describe("importResourceFolder", () => {
  it("strips a shared wrapper and preserves nested paths", async () => {
    const result = await importResourceFolder([
      folderFile("Export/diagram.png"),
      folderFile("Export/nested/Handout.PDF"),
    ]);

    expect(result.fileCount).toBe(2);
    expect([...result.resources.keys()]).toEqual(["diagram.png", "nested/handout.pdf"]);
    expect(result.resources.get("nested/handout.pdf")?.relativePath).toBe("nested/Handout.PDF");
  });

  it("ignores operating-system metadata", async () => {
    const result = await importResourceFolder([
      folderFile("Export/__MACOSX/._diagram.png"),
      folderFile("Export/.DS_Store"),
      folderFile("Export/diagram.png"),
    ]);

    expect(result.fileCount).toBe(1);
    expect([...result.resources.keys()]).toEqual(["diagram.png"]);
  });

  it("handles an empty folder selection", async () => {
    const result = await importResourceFolder([]);
    expect(result).toEqual({ resources: new Map(), fileCount: 0 });
  });
});
