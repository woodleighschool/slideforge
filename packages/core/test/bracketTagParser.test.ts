import { describe, expect, it } from "vitest";

import { isPureTagContent, splitIntoRuns } from "../src/bracketTagParser.js";

describe("splitIntoRuns", () => {
  it("preserves text around a configured image tag", () => {
    expect(splitIntoRuns("Before [[image:diagram.png|left|medium|caption||]] after")).toEqual([
      { kind: "text", text: "Before " },
      {
        kind: "tag",
        tag: {
          type: "image",
          filename: "diagram.png",
          position: "left",
          size: "medium",
          extras: ["caption"],
        },
      },
      { kind: "text", text: " after" },
    ]);
  });

  it("keeps invalid tags as lesson text", () => {
    expect(splitIntoRuns("Keep [[image:]] visible")).toEqual([
      { kind: "text", text: "Keep " },
      { kind: "text", text: "[[image:]]" },
      { kind: "text", text: " visible" },
    ]);
    expect(isPureTagContent("[[image:]]")).toBe(false);
  });

  it("recognises tag-only content with surrounding whitespace", () => {
    expect(
      isPureTagContent(" \n [[resource:handout.pdf]] [[embed:https://example.invalid]] "),
    ).toBe(true);
  });
});
