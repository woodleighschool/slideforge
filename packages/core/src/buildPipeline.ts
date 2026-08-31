// Orchestrates the full HTML -> pptx pipeline: parse -> assemble -> match
// resources -> hand off to generatePptx.

import { parseLessonHTML } from "./lessonHTMLParser.js";
import { matchResource } from "./resourceMatcher.js";
import { assembleSlides } from "./slideAssembler.js";
import type { GenerationInput, GenItem, GenSlide, ResourceMap } from "./types.js";

export interface BuildGenerationInputArgs {
  presentationName: string;
  lessonHTML: string;
  resources: ResourceMap;
}

export function buildGenerationInput({
  presentationName,
  lessonHTML,
  resources,
}: BuildGenerationInputArgs): GenerationInput {
  const blocks = parseLessonHTML(lessonHTML);
  const assembled = assembleSlides(blocks);

  const unmatchedImages: string[] = [];

  const slides: GenSlide[] = assembled.map((slide) => {
    if (slide.type === "video") {
      return { type: "video", title: slide.title, url: slide.url };
    }

    const items: GenItem[] = [];
    for (const item of slide.items) {
      if (item.kind === "image") {
        const matched = matchResource(item.filename, resources);
        if (!matched) unmatchedImages.push(item.filename);
        items.push({
          kind: "image",
          image: {
            dataUrl: matched ? matched.dataUrl : null,
            filename: item.filename,
            position: item.position,
            size: item.size,
          },
        });
      } else if (item.kind === "paragraph") {
        items.push({ kind: "paragraph", paragraph: item.runs });
      } else if (item.kind === "bulletList") {
        items.push({ kind: "bulletList", bulletList: item.items });
      } else if (item.kind === "table") {
        items.push({ kind: "table", table: item.rows });
      } else if (item.kind === "resourceCard") {
        items.push({ kind: "resource", resource: item.filename });
      }
    }

    return { type: "content", title: slide.title, items };
  });

  const safeName = presentationName.trim() || "Presentation";

  return {
    outputName: safeName,
    slides,
    parsedBlockCount: blocks.length,
    unmatchedImages,
    blocks,
  };
}
