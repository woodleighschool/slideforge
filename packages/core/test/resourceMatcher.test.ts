import { describe, expect, it } from "vitest";

import { matchResource } from "../src/resourceMatcher.js";
import type { ResourceEntry, ResourceMap } from "../src/types.js";

function entry(relativePath: string): ResourceEntry {
  return { relativePath, blob: new Blob(), dataUrl: `data:${relativePath}`, bytes: 0 };
}

function resources(...paths: string[]): ResourceMap {
  return new Map(paths.map((path) => [path.toLowerCase(), entry(path)]));
}

describe("matchResource", () => {
  it("matches nested paths and filename case", () => {
    const resource = matchResource("Diagram.PNG", resources("nested/assets/diagram.png"));
    expect(resource?.relativePath).toBe("nested/assets/diagram.png");
  });

  it("matches Seqta numeric filename prefixes", () => {
    const resource = matchResource("handout.pdf", resources("Resources/42_handout.pdf"));
    expect(resource?.relativePath).toBe("Resources/42_handout.pdf");
  });

  it("does not strip non-numeric prefixes", () => {
    expect(matchResource("photo.png", resources("draft_photo.png"))).toBeNull();
  });
});
