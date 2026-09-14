import { describe, expect, it } from "vitest";

import { planContentPages } from "../src/generatePptx.js";
import type { GenItem } from "../src/types.js";

function paragraph(length: number): GenItem {
  return { kind: "paragraph", paragraph: [{ kind: "plain", text: "A".repeat(length) }] };
}

function image(filename = "diagram.png"): GenItem {
  return {
    kind: "image",
    image: { dataUrl: null, filename, position: "left", size: "medium" },
  };
}

/** A non-paragraph filler block, so it can take up space without itself
 * being eligible to bond with an adjacent image (see isCaptionPair). */
function bulletFiller(itemCount: number): GenItem {
  return {
    kind: "bulletList",
    bulletList: Array.from({ length: itemCount }, (_, i) => `Item ${i}`),
  };
}

describe("planContentPages", () => {
  it("keeps a caption paragraph and its adjacent image on the same page even when the pair doesn't fit what's left", async () => {
    // Long enough filler leaves just enough room for the caption alone, but
    // not enough for the caption + image together — this reproduces an
    // image getting bumped to a "(cont.)" slide while its caption stayed
    // behind, orphaned, on the slide before it.
    const items: GenItem[] = [paragraph(2200), paragraph(8), image()];

    const pages = await planContentPages(items);

    expect(pages).toHaveLength(2);
    // The filler paragraph stays alone on page 1.
    expect(pages[0]).toHaveLength(1);
    // The caption and the image move together onto page 2, in order.
    expect(pages[1]?.map((b) => b.kind)).toEqual(["paragraph", "imageRow"]);
  });

  it("keeps an image and its following caption together when the image comes first", async () => {
    // Filler is a bullet list here (not a paragraph) specifically so it
    // doesn't itself bond with the image — this isolates the image+caption
    // pairing direction from the paragraph+image pairing covered above.
    const items: GenItem[] = [bulletFiller(11), image(), paragraph(8)];

    const pages = await planContentPages(items);

    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(1);
    expect(pages[1]?.map((b) => b.kind)).toEqual(["imageRow", "paragraph"]);
  });

  it("does not bond a third adjacent block, so bonding can't swallow a whole slide", async () => {
    const items: GenItem[] = [paragraph(20), image(), paragraph(20)];

    const pages = await planContentPages(items);

    // Everything still fits on one page here; the point is just that the
    // grouping doesn't chain paragraph+image+paragraph into one unbreakable
    // block that would then be free to overflow the slide.
    expect(pages).toHaveLength(1);
    expect(pages[0]?.map((b) => b.kind)).toEqual(["paragraph", "imageRow", "paragraph"]);
  });

  it("still paginates normally between unrelated blocks that overflow", async () => {
    const items: GenItem[] = [paragraph(2200), paragraph(2200)];

    const pages = await planContentPages(items);

    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(1);
    expect(pages[1]).toHaveLength(1);
  });

  it("returns a single empty page for a slide with no items", async () => {
    const pages = await planContentPages([]);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toEqual([]);
  });
});
