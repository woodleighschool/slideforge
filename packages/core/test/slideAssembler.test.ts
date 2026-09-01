import { describe, expect, it } from "vitest";

import { assembleSlides } from "../src/slideAssembler.js";
import type { LessonBlock } from "../src/types.js";

describe("assembleSlides", () => {
  it("isolates video slides and resumes content under the current title", () => {
    const blocks: LessonBlock[] = [
      { type: "slideTitle", title: "Topic" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "Before" }] },
      { type: "videoEmbed", url: "https://example.invalid/video", mode: "full" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "After" }] },
    ];

    expect(assembleSlides(blocks)).toEqual([
      {
        type: "content",
        title: "Topic",
        items: [{ kind: "paragraph", runs: [{ kind: "plain", text: "Before" }] }],
      },
      { type: "video", title: "Topic", url: "https://example.invalid/video" },
      {
        type: "content",
        title: "Topic",
        items: [{ kind: "paragraph", runs: [{ kind: "plain", text: "After" }] }],
      },
    ]);
  });

  it("does not emit a title-only slide before a video", () => {
    expect(
      assembleSlides([
        { type: "slideTitle", title: "Watch" },
        { type: "videoEmbed", url: "https://example.invalid/video", mode: "full" },
      ]),
    ).toEqual([{ type: "video", title: "Watch", url: "https://example.invalid/video" }]);
  });
});
