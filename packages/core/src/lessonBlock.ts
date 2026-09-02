import type { BlockMeta, LessonBlock } from "./types.js";

export function blockMeta(block: LessonBlock): BlockMeta {
  switch (block.type) {
    case "slideTitle":
      return { label: "New slide", summary: block.title };
    case "paragraphText":
      return {
        label: "Paragraph",
        summary: block.runs.map((run) => run.text).join(""),
      };
    case "bulletList":
      return { label: "Bullet list", summary: block.items.join(" · ") };
    case "table":
      return {
        label: "Table",
        summary: `${block.rows.length} row${block.rows.length === 1 ? "" : "s"}`,
      };
    case "image": {
      const attributes = [block.position, block.size].filter(Boolean).join(", ");
      return {
        label: "Image",
        summary: attributes ? `${block.filename} (${attributes})` : block.filename,
      };
    }
    case "resourceCard":
      return { label: "Resource", summary: block.filename };
    case "videoEmbed":
      return { label: "Video", summary: `${block.url} (${block.mode})` };
  }
}
