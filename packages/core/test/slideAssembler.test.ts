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

  it("merges two consecutive headings with nothing between them into one title", () => {
    // e.g. a title that Word/Seqta wrapped across two <h2> elements.
    const blocks: LessonBlock[] = [
      { type: "slideTitle", title: "Understanding Scams:" },
      { type: "slideTitle", title: "Identifying Red Flags" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "Body text." }] },
    ];

    const slides = assembleSlides(blocks);

    expect(slides).toHaveLength(1);
    const slide = slides[0];
    expect(slide?.type).toBe("content");
    if (slide?.type === "content") {
      expect(slide.title).toBe("Understanding Scams:\nIdentifying Red Flags");
      expect(slide.items).toHaveLength(1);
    }
  });

  it("merges a question heading immediately followed by an answer heading", () => {
    const blocks: LessonBlock[] = [
      { type: "slideTitle", title: "What is inflation?" },
      { type: "slideTitle", title: "Rising prices over time." },
    ];

    const slides = assembleSlides(blocks);

    expect(slides).toHaveLength(1);
    expect(slides[0]).toMatchObject({ title: "What is inflation?\nRising prices over time." });
  });

  it("does NOT merge headings that already have content under them", () => {
    const blocks: LessonBlock[] = [
      { type: "slideTitle", title: "Section A" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "Some content." }] },
      { type: "slideTitle", title: "Section B" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "More content." }] },
    ];

    const slides = assembleSlides(blocks);

    expect(slides).toHaveLength(2);
    expect(slides[0]).toMatchObject({ title: "Section A" });
    expect(slides[1]).toMatchObject({ title: "Section B" });
  });

  it("merges three or more consecutive headings into one multi-line title", () => {
    const blocks: LessonBlock[] = [
      { type: "slideTitle", title: "Line One" },
      { type: "slideTitle", title: "Line Two" },
      { type: "slideTitle", title: "Line Three" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "Body." }] },
    ];

    const slides = assembleSlides(blocks);

    expect(slides).toHaveLength(1);
    expect(slides[0]).toMatchObject({ title: "Line One\nLine Two\nLine Three" });
  });

  it("still gives a title-only heading its own slide when nothing follows", () => {
    const blocks: LessonBlock[] = [{ type: "slideTitle", title: "Just a divider" }];

    const slides = assembleSlides(blocks);

    expect(slides).toHaveLength(1);
    expect(slides[0]).toMatchObject({ title: "Just a divider", items: [] });
  });

  it("does not merge a heading that follows a video with nothing before it", () => {
    const blocks: LessonBlock[] = [
      { type: "slideTitle", title: "Watch this" },
      { type: "videoEmbed", url: "https://example.com/video", mode: "full" },
      { type: "slideTitle", title: "Next section" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "Body." }] },
    ];

    const slides = assembleSlides(blocks);

    const titles = slides.map((s) => s.title);
    expect(titles).toEqual(["Watch this", "Next section"]);
  });
});
