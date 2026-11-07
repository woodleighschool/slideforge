import { describe, expect, it } from "vitest";

import { extractLessonBlocksFromSavedPage } from "../src/seqtaSavedPageModules.js";

// Synthetic stand-ins for a saved Seqta lesson page's module markup — same
// shapes (RootModule wrapper, Module__wrapper, the type-label badge, the
// inline Toolbar__Toolbar, and each module-body class) confirmed against
// real saved pages during development, but with placeholder text and no
// real lesson content, per the project's testing rules.

function moduleShell(typeLabel: string, body: string): string {
  return (
    `<div class="Module__wrapper___mC00E" data-testid="lesson-module">` +
    `<div class="Module__module___q1"><div class="Module__content___q2">` +
    `<div class="ModuleTitle__ModuleTitle___q3">` +
    `<div class="ModuleTitle__title___q4" data-testid="module-type-label">${typeLabel}</div>` +
    `<div class="ModuleTitle__buttons___q5"><svg></svg></div>` +
    `</div>${body}</div></div></div>`
  );
}

function titleModule(text: string): string {
  return moduleShell("Title", `<div class="TitleModuleBody__moduleBody___X3nMr">${text}</div>`);
}

function textModule(innerHTML: string): string {
  // Confirmed against a real saved page: a plain "Text" module's own body
  // wrapper carries no class matching "ModuleBody" at all (unlike Title,
  // Math, Resources, and layout modules), so it always falls to the
  // generic parseLessonHTML fallback rather than a dedicated case.
  return moduleShell(
    "Text",
    `<div class="TextBlock__content___q9">` +
      `<div class="Toolbar__Toolbar___xps1j seqtaeditor-toolbar-large">` +
      `<button>Normal</button></div>${innerHTML}</div>`,
  );
}

function resourceCard(filename: string): string {
  return (
    `<li class="ResourceModuleBody__card___h1">` +
    `<a class="ResourceModuleBody__name___h1">` +
    `<svg></svg><div class="ResourceModuleBody__name___h1">${filename}</div></a></li>`
  );
}

function resourceModule(...filenames: string[]): string {
  return moduleShell(
    "Resource(s)",
    `<div class="ResourceModuleBody__moduleBody___xzEup"><ol>` +
      filenames.map(resourceCard).join("") +
      `</ol></div>`,
  );
}

function legacyModule(): string {
  return moduleShell(
    "Legacy editor",
    `<div class="uiFormattedTextWrapper LegacyModuleBody__LegacyModule___Bs9jF">` +
      `<iframe class="cke_wysiwyg_frame cke_reset" src="./page_files/saved_resource.html"></iframe>` +
      `</div>`,
  );
}

function layoutModule(...nestedModules: string[]): string {
  return moduleShell(
    "Advanced layout",
    `<div class="MultiColumnLayout__multiColumnBody___VVYPB LayoutModuleBody__layout___uPkXp">` +
      nestedModules.join("") +
      `</div>`,
  );
}

function rootModule(...modules: string[]): string {
  return (
    `<div class="Chrome__content___zzz"><div class="SEQTAEditor__SEQTAEditor___abc">` +
    `<div class="RootModule__root-module___xYz12">${modules.join("")}</div>` +
    `</div></div>`
  );
}

function page(body: string): string {
  return `<html><body>${body}</body></html>`;
}

describe("extractLessonBlocksFromSavedPage", () => {
  it("returns nothing when the page has no RootModule wrapper at all", () => {
    expect(extractLessonBlocksFromSavedPage(page("<p>Some other page entirely.</p>"))).toEqual([]);
  });

  it("extracts a Title module as a slideTitle, with the type badge stripped out", () => {
    const html = page(rootModule(titleModule("Sample Lesson Heading")));

    expect(extractLessonBlocksFromSavedPage(html)).toEqual([
      { type: "slideTitle", title: "Sample Lesson Heading" },
    ]);
  });

  it("extracts a Resources module as one resourceCard per file, badge and toolbar aside", () => {
    const html = page(rootModule(resourceModule("Handout one.pdf", "Handout two.docx")));

    expect(extractLessonBlocksFromSavedPage(html)).toEqual([
      { type: "resourceCard", filename: "Handout one.pdf" },
      { type: "resourceCard", filename: "Handout two.docx" },
    ]);
  });

  it("extracts a plain Text module's paragraph through the generic fallback, toolbar stripped", () => {
    const html = page(rootModule(textModule("<p>Sample paragraph about today's topic.</p>")));

    expect(extractLessonBlocksFromSavedPage(html)).toEqual([
      {
        type: "paragraphText",
        runs: [{ kind: "plain", text: "Sample paragraph about today's topic." }],
      },
    ]);
  });

  it("gives a Legacy editor module a single wordless placeholder, not an explanation", () => {
    const html = page(rootModule(legacyModule()));

    const blocks = extractLessonBlocksFromSavedPage(html);
    expect(blocks).toEqual([{ type: "paragraphText", runs: [{ kind: "plain", text: "" }] }]);
  });

  it("recurses into a layout module's nested Title + Resources pair", () => {
    const html = page(
      rootModule(layoutModule(titleModule("Nested heading"), resourceModule("Nested file.pdf"))),
    );

    expect(extractLessonBlocksFromSavedPage(html)).toEqual([
      { type: "slideTitle", title: "Nested heading" },
      { type: "resourceCard", filename: "Nested file.pdf" },
    ]);
  });

  it("preserves document order across a full mix of module types", () => {
    const html = page(
      rootModule(
        titleModule("Lesson heading"),
        textModule("<p>Some intro text.</p>"),
        legacyModule(),
        resourceModule("Worksheet.pdf"),
      ),
    );

    expect(extractLessonBlocksFromSavedPage(html)).toEqual([
      { type: "slideTitle", title: "Lesson heading" },
      { type: "paragraphText", runs: [{ kind: "plain", text: "Some intro text." }] },
      { type: "paragraphText", runs: [{ kind: "plain", text: "" }] },
      { type: "resourceCard", filename: "Worksheet.pdf" },
    ]);
  });

  it("ignores anything outside the RootModule wrapper, such as Essential Learning/Homework sections", () => {
    const html = page(
      `<div class="EssentialLearning__section___e1"><p>Essential learning text.</p></div>` +
        rootModule(titleModule("Lesson heading")) +
        `<div class="Homework__section___h1"><p>Homework text.</p></div>`,
    );

    expect(extractLessonBlocksFromSavedPage(html)).toEqual([
      { type: "slideTitle", title: "Lesson heading" },
    ]);
  });
});
