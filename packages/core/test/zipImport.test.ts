import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { importResourceZip } from "../src/zipImport.js";

describe("importResourceZip", () => {
  it("ignores macOS metadata and removes a shared wrapper folder", async () => {
    const zip = new JSZip();
    zip.file("Resources/diagram.png", "synthetic image");
    zip.file("Resources/nested/handout.pdf", "synthetic document");
    zip.file("__MACOSX/Resources/._diagram.png", "metadata");

    const archive = await zip.generateAsync({ type: "blob" });
    const result = await importResourceZip(archive);

    expect(result.fileCount).toBe(2);
    expect([...result.resources.keys()]).toEqual(["diagram.png", "nested/handout.pdf"]);
    expect(result.resources.get("diagram.png")?.dataUrl).toMatch(/^data:/);
  });
});
