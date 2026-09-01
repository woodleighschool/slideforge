import { describe, expect, it } from "vitest";

import { buildGenerationInput } from "../src/buildPipeline.js";
import { parseLessonHTML } from "../src/lessonHTMLParser.js";
import type { ResourceEntry } from "../src/types.js";

const LESSON_HTML = `
  <h2>Introduction</h2>
  <p>Welcome to the lesson. See <a href="https://example.com">the syllabus</a> for details.</p>
  <ul>
    <li>First point</li>
    <li>Second point</li>
  </ul>
  <table>
    <tr><th>Term</th><th>Definition</th></tr>
    <tr><td>Inflation</td><td>Rising prices</td></tr>
  </table>
  [[image:diagram.png|left|medium]]
  [[resource:handout.pdf]]
  <h2>Video</h2>
  [[embed:https://youtu.be/example|full]]
  <h2>Wrap-up</h2>
  <p>&nbsp;</p>
  <p>Thanks for watching.</p>
`;

function resourceMap(entries: Record<string, Partial<ResourceEntry>>): Map<string, ResourceEntry> {
  const map = new Map<string, ResourceEntry>();
  for (const [key, value] of Object.entries(entries)) {
    map.set(key.toLowerCase(), {
      relativePath: value.relativePath ?? key,
      blob: value.blob ?? new Blob(),
      dataUrl: value.dataUrl ?? "data:image/png;base64,AAAA",
      bytes: value.bytes ?? 4,
    });
  }
  return map;
}

describe("parseLessonHTML", () => {
  it("does not emit empty paragraph blocks for whitespace-only content", () => {
    const blocks = parseLessonHTML(LESSON_HTML);
    const emptyParagraphs = blocks.filter((b) => b.type === "paragraphText" && b.runs.length === 0);
    expect(emptyParagraphs).toHaveLength(0);
  });

  it("keeps a hyperlink run attached to its URL", () => {
    const blocks = parseLessonHTML(LESSON_HTML);
    const paragraph = blocks.find(
      (b) => b.type === "paragraphText" && b.runs.some((r) => r.kind === "link"),
    );
    expect(paragraph).toBeDefined();
  });
});

describe("buildGenerationInput", () => {
  it("assembles slides, matches resources, and reports unmatched images", () => {
    const resources = resourceMap({
      "diagram.png": { relativePath: "diagram.png" },
    });

    const result = buildGenerationInput({
      presentationName: "Test Lesson",
      lessonHTML: LESSON_HTML,
      resources,
    });

    expect(result.outputName).toBe("Test Lesson");
    expect(result.unmatchedImages).toHaveLength(0);

    const videoSlide = result.slides.find((s) => s.type === "video");
    expect(videoSlide).toBeDefined();

    const introSlide = result.slides.find(
      (s) => s.type === "content" && s.title === "Introduction",
    );
    expect(introSlide).toBeDefined();
  });

  it("reports an image as unmatched when no resource fits", () => {
    const result = buildGenerationInput({
      presentationName: "",
      lessonHTML: "[[image:missing.png]]",
      resources: resourceMap({}),
    });

    expect(result.outputName).toBe("Presentation");
    expect(result.unmatchedImages).toEqual(["missing.png"]);
  });

  it("matches Seqta's '<id>_filename' export naming", () => {
    const resources = resourceMap({
      "42_photo.png": { relativePath: "42_photo.png" },
    });

    const result = buildGenerationInput({
      presentationName: "Test",
      lessonHTML: "[[image:photo.png]]",
      resources,
    });

    expect(result.unmatchedImages).toHaveLength(0);
  });
});
