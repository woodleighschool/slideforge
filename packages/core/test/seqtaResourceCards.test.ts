import { describe, expect, it } from "vitest";

import { extractResourceCardFilenames } from "../src/seqtaResourceCards.js";

/** A trimmed-down stand-in for a saved Seqta lesson page's Resources
 * block — same shape (an <a> wrapping an icon and a name <div>, both
 * sharing one CSS-module class), with a build-specific hash suffix on the
 * class name, same as a real export. */
function resourceCard(filename: string, hash: string): string {
  return (
    `<li class="ResourceModuleBody__card___${hash}">` +
    `<a href="https://example.test/file/get?id=1" class="ResourceModuleBody__name___${hash}">` +
    `<svg></svg><div class="ResourceModuleBody__name___${hash}">${filename}</div></a></li>`
  );
}

describe("extractResourceCardFilenames", () => {
  it("reads the full name out of a resource card, even though both the link and the name share a class", () => {
    const html = `<html><body><ol>${resourceCard("Worksheet notes.pdf", "AbC1")}</ol></body></html>`;

    expect(extractResourceCardFilenames(html)).toEqual(["Worksheet notes.pdf"]);
  });

  it("tolerates a different build's class-name hash", () => {
    const html = `<html><body><ol>${resourceCard("Worksheet notes.pdf", "Zz99")}</ol></body></html>`;

    expect(extractResourceCardFilenames(html)).toEqual(["Worksheet notes.pdf"]);
  });

  it("returns every card in document order, deduped", () => {
    const html =
      `<html><body><ol>` +
      resourceCard("First file.pdf", "AbC1") +
      resourceCard("Second file.docx", "AbC1") +
      `</ol></body></html>`;

    expect(extractResourceCardFilenames(html)).toEqual(["First file.pdf", "Second file.docx"]);
  });

  it("returns nothing for lesson HTML with no Resources block", () => {
    expect(extractResourceCardFilenames("<p>Just some lesson text.</p>")).toEqual([]);
  });
});
