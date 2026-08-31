// Groups a flat block list into slides:
// - A heading starts a new combined slide; text/lists/tables/resources/images
//   under it all land on that same slide, in ONE ordered `items` sequence
//   (not grouped by kind) — this is what lets generatePptx.ts render an
//   image at its true position in the reading order instead of always
//   pulled out to a fixed corner.
// - A video always breaks out into its own dedicated slide, then content
//   after it continues on a fresh slide under the same title.

import type { AssembledSlide, ContentSlide, LessonBlock } from "./types.js";

export function emptyContentSlide(title: string): ContentSlide {
  return { type: "content", title, items: [] };
}

export function assembleSlides(blocks: LessonBlock[]): AssembledSlide[] {
  const result: AssembledSlide[] = [];
  let currentTitle = "";
  let current = emptyContentSlide("");
  let hasTitledContent = false;

  function flushCurrentIfNeeded() {
    if (hasTitledContent) result.push(current);
  }

  for (const block of blocks) {
    switch (block.type) {
      case "slideTitle":
        flushCurrentIfNeeded();
        currentTitle = block.title;
        current = emptyContentSlide(block.title);
        hasTitledContent = true; // a heading alone still deserves its own slide
        break;

      case "paragraphText":
        current.items.push({ kind: "paragraph", runs: block.runs });
        hasTitledContent = true;
        break;

      case "bulletList":
        current.items.push({ kind: "bulletList", items: block.items });
        hasTitledContent = true;
        break;

      case "table":
        current.items.push({ kind: "table", rows: block.rows });
        hasTitledContent = true;
        break;

      case "image":
        current.items.push({
          kind: "image",
          filename: block.filename,
          position: block.position,
          size: block.size,
        });
        hasTitledContent = true;
        break;

      case "resourceCard":
        current.items.push({ kind: "resourceCard", filename: block.filename });
        hasTitledContent = true;
        break;

      case "videoEmbed":
        // Only flush the pending content slide if it actually has something
        // in it. A heading followed immediately by a video with nothing in
        // between otherwise produced a pointless title-only slide right
        // before the video slide.
        if (current.items.length > 0) result.push(current);
        result.push({ type: "video", title: currentTitle, url: block.url });
        // Anything after the video continues under the same heading, as a
        // fresh combined slide rather than reopening the old one.
        current = emptyContentSlide(currentTitle);
        hasTitledContent = false;
        break;

      default:
        break;
    }
  }

  flushCurrentIfNeeded();
  return result;
}
