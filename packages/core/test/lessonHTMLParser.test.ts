import { describe, expect, it } from "vitest";

import { parseLessonHTML } from "../src/lessonHTMLParser.js";

describe("parseLessonHTML", () => {
  it("walks transparent wrappers while preserving loose links and line boundaries", () => {
    const blocks = parseLessonHTML(`
      <div><div>Before <a href="https://example.invalid/topic">linked text</a><br>After</div></div>
    `);

    expect(blocks).toEqual([
      {
        type: "paragraphText",
        runs: [
          { kind: "plain", text: "Before " },
          { kind: "link", text: "linked text", url: "https://example.invalid/topic" },
        ],
      },
      { type: "paragraphText", runs: [{ kind: "plain", text: "After" }] },
    ]);
  });

  it("keeps inline tags in their source order", () => {
    expect(parseLessonHTML("<p>Before [[image:diagram.png]] after</p>")).toEqual([
      { type: "paragraphText", runs: [{ kind: "plain", text: "Before" }] },
      {
        type: "image",
        filename: "diagram.png",
        position: null,
        size: null,
        extras: [],
      },
      { type: "paragraphText", runs: [{ kind: "plain", text: "after" }] },
    ]);
  });

  it("drops empty Office artifacts without dropping adjacent content", () => {
    expect(parseLessonHTML("<h2><o:p>&nbsp;</o:p></h2><p>Useful content</p>")).toEqual([
      { type: "paragraphText", runs: [{ kind: "plain", text: "Useful content" }] },
    ]);
  });
});
