// Orchestrates the full lesson -> pptx pipeline: extract blocks -> assemble
// -> match resources -> hand off to generatePptx. The saved lesson page
// (seqtaSavedPageModules.ts) is the only source of lesson content the app
// uses.

import type { CompanionFileMap } from "./seqtaSavedPageModules.js";
import { extractLessonBlocksFromSavedPage } from "./seqtaSavedPageModules.js";
import { matchResource } from "./resourceMatcher.js";
import { assembleSlides } from "./slideAssembler.js";
import type { GenerationInput, GenItem, GenSlide, LessonBlock, ResourceMap } from "./types.js";

export interface BuildGenerationInputFromSavedPageArgs {
  presentationName: string;
  savedPageHTML: string;
  /** The saved page's companion "<page>_files" folder, filename -> text
   * content, if the teacher supplied it. Optional — recovers real Legacy
   * editor content instead of a blank placeholder, but the build still
   * works without it. */
  companionFiles?: CompanionFileMap;
  resources: ResourceMap;
}

export function buildGenerationInputFromSavedPage({
  presentationName,
  savedPageHTML,
  companionFiles,
  resources,
}: BuildGenerationInputFromSavedPageArgs): GenerationInput {
  const blocks = extractLessonBlocksFromSavedPage(savedPageHTML, companionFiles);
  return assembleGenerationInput(presentationName, blocks, resources);
}

function assembleGenerationInput(
  presentationName: string,
  blocks: LessonBlock[],
  resources: ResourceMap,
): GenerationInput {
  const assembled = assembleSlides(blocks);

  const unmatchedImages: string[] = [];
  const unmatchedResources: string[] = [];

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
        const matched = matchResource(item.filename, resources);
        if (!matched) unmatchedResources.push(item.filename);
        items.push({
          kind: "resource",
          resource: { dataUrl: matched ? matched.dataUrl : null, filename: item.filename },
        });
      }
    }

    return { type: "content", title: slide.title, items };
  });

  const safeName = presentationName.trim() || "Presentation";

  return {
    outputName: safeName,
    slides,
    unmatchedImages,
    unmatchedResources,
  };
}
