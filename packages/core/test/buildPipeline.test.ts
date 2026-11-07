import { describe, expect, it } from "vitest";

import { buildGenerationInputFromSavedPage } from "../src/buildPipeline.js";
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

// Synthetic stand-ins for a saved Seqta lesson page's module markup — same
// shapes covered in seqtaSavedPageModules.test.ts. A generic/"Text" module's
// own body carries no class matching "ModuleBody", so its content always
// goes through the genericBlocks -> parseLessonHTML fallback; bracket tags
// inside that fallback content exercise the same image/resource/embed
// matching parseLessonHTML already handles on its own.
function moduleShell(typeLabel: string, body: string): string {
  return (
    `<div class="Module__wrapper___mC00E" data-testid="lesson-module">` +
    `<div class="Module__module___q1"><div class="Module__content___q2">` +
    `<div class="ModuleTitle__ModuleTitle___q3">` +
    `<div class="ModuleTitle__title___q4" data-testid="module-type-label">${typeLabel}</div>` +
    `</div>${body}</div></div></div>`
  );
}

function titleModule(text: string): string {
  return moduleShell("Title", `<div class="TitleModuleBody__moduleBody___X3nMr">${text}</div>`);
}

function textModule(innerHTML: string): string {
  return moduleShell("Text", `<div class="TextBlock__content___q9">${innerHTML}</div>`);
}

function savedPage(...modules: string[]): string {
  return (
    `<html><body><div class="RootModule__root-module___xYz12">` +
    modules.join("") +
    `</div></body></html>`
  );
}

const SAVED_PAGE_HTML = savedPage(
  titleModule("Introduction"),
  textModule(
    `<p>Welcome to the lesson. See <a href="https://example.com">the syllabus</a> for details.</p>
    <ul>
      <li>First point</li>
      <li>Second point</li>
    </ul>
    <table>
      <tr><th>Term</th><th>Definition</th></tr>
      <tr><td>Inflation</td><td>Rising prices</td></tr>
    </table>
    [[image:diagram.png|left|medium]]
    [[resource:handout.pdf]]`,
  ),
  titleModule("Video"),
  textModule("[[embed:https://youtu.be/example|full]]"),
  titleModule("Wrap-up"),
  textModule("<p>&nbsp;</p><p>Thanks for watching.</p>"),
);

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

describe("buildGenerationInputFromSavedPage", () => {
  it("assembles slides, matches resources, and reports unmatched images", () => {
    const resources = resourceMap({
      "diagram.png": { relativePath: "diagram.png" },
    });

    const result = buildGenerationInputFromSavedPage({
      presentationName: "Test Lesson",
      savedPageHTML: SAVED_PAGE_HTML,
      resources,
    });

    expect(result.outputName).toBe("Test Lesson");
    expect(result.unmatchedImages).toHaveLength(0);
    expect(result.unmatchedResources).toEqual(["handout.pdf"]);

    const videoSlide = result.slides.find((s) => s.type === "video");
    expect(videoSlide).toBeDefined();

    const introSlide = result.slides.find(
      (s) => s.type === "content" && s.title === "Introduction",
    );
    expect(introSlide).toBeDefined();
  });

  it("reports an image as unmatched when no resource fits", () => {
    const result = buildGenerationInputFromSavedPage({
      presentationName: "",
      savedPageHTML: savedPage(textModule("[[image:missing.png]]")),
      resources: resourceMap({}),
    });

    expect(result.outputName).toBe("Presentation");
    expect(result.unmatchedImages).toEqual(["missing.png"]);
  });

  it("matches Seqta's '<id>_filename' export naming", () => {
    const resources = resourceMap({
      "42_photo.png": { relativePath: "42_photo.png" },
    });

    const result = buildGenerationInputFromSavedPage({
      presentationName: "Test",
      savedPageHTML: savedPage(textModule("[[image:photo.png]]")),
      resources,
    });

    expect(result.unmatchedImages).toHaveLength(0);
  });

  it("matches a resource card against the resources zip and carries its data", () => {
    const resources = resourceMap({
      "handout.docx": {
        relativePath: "handout.docx",
        dataUrl:
          "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AAAA",
      },
    });

    const result = buildGenerationInputFromSavedPage({
      presentationName: "Test",
      savedPageHTML: savedPage(textModule("[[resource:handout.docx]]")),
      resources,
    });

    expect(result.unmatchedResources).toHaveLength(0);
    const slide = result.slides.find((s) => s.type === "content");
    const resourceItem =
      slide?.type === "content" ? slide.items.find((i) => i.kind === "resource") : undefined;
    expect(resourceItem).toMatchObject({
      kind: "resource",
      resource: {
        filename: "handout.docx",
        dataUrl:
          "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AAAA",
      },
    });
  });

  it("reports a resource card as unmatched when no resource fits", () => {
    const result = buildGenerationInputFromSavedPage({
      presentationName: "",
      savedPageHTML: savedPage(textModule("[[resource:missing.docx]]")),
      resources: resourceMap({}),
    });

    expect(result.unmatchedResources).toEqual(["missing.docx"]);
  });

  it("matches a resource card using Seqta's '<id>_filename' export naming", () => {
    const resources = resourceMap({
      "17_Handout.docx": { relativePath: "17_Handout.docx" },
    });

    const result = buildGenerationInputFromSavedPage({
      presentationName: "Test",
      savedPageHTML: savedPage(textModule("[[resource:Handout.docx]]")),
      resources,
    });

    expect(result.unmatchedResources).toHaveLength(0);
  });
});
