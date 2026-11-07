import { describe, expect, it } from "vitest";

import {
  extractResourceCardFilenames,
  matchSavedPageResources,
} from "../src/seqtaResourceCards.js";
import type { ResourceEntry, ResourceMap } from "../src/types.js";

function resourceMap(entries: Record<string, Partial<ResourceEntry>>): ResourceMap {
  const map: ResourceMap = new Map();
  for (const [key, value] of Object.entries(entries)) {
    map.set(key.toLowerCase(), {
      relativePath: value.relativePath ?? key,
      blob: value.blob ?? new Blob(),
      dataUrl: value.dataUrl ?? "data:application/pdf;base64,AAAA",
      bytes: value.bytes ?? 4,
    });
  }
  return map;
}

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

describe("matchSavedPageResources", () => {
  it("matches a card's exact name against the resources folder's export-prefixed name", () => {
    const html = `<html><body>${resourceCard("Worksheet notes.pdf", "AbC1")}</body></html>`;
    const resources = resourceMap({
      "12_Worksheet notes.pdf": {
        relativePath: "12_Worksheet notes.pdf",
        dataUrl: "data:application/pdf;base64,AAAA",
      },
    });

    const result = matchSavedPageResources(html, resources);

    expect(result.matched).toEqual([
      { filename: "Worksheet notes.pdf", dataUrl: "data:application/pdf;base64,AAAA" },
    ]);
    expect(result.unmatchedFilenames).toEqual([]);
  });

  it("reports a card's file as unmatched when it isn't in the loaded resources", () => {
    const html = `<html><body>${resourceCard("Missing file.pdf", "AbC1")}</body></html>`;

    const result = matchSavedPageResources(html, resourceMap({}));

    expect(result.matched).toEqual([]);
    expect(result.unmatchedFilenames).toEqual(["Missing file.pdf"]);
  });

  it("returns nothing for a page with no Resources block", () => {
    const result = matchSavedPageResources(
      "<p>Just app chrome, no resources.</p>",
      resourceMap({}),
    );

    expect(result.matched).toEqual([]);
    expect(result.unmatchedFilenames).toEqual([]);
  });
});
