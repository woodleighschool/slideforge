// Same fixed-theme, deterministic layout rules as the original Node/pptxgenjs
// generator, ported to run directly in the browser tab:
//   - images come in as data: URLs (already read into memory by zipImport.ts)
//     — pptxgenjs's addImage() accepts a `data` URI directly.
//   - image dimensions are read via a browser Image() load.
//   - pptx.writeFile() in a browser context triggers a normal browser
//     download instead of writing to disk — nothing here ever leaves the tab.

import PptxGenJS from "pptxgenjs";

import type { GenerationInput, GenItem, GenSlide, TextRun, Theme } from "./types.js";

// pptxgenjs's shipped types don't model every option shape used below
// (fill/line objects, the hyperlink run option, percentage-string
// coordinates); rather than fight that per call site, run options are typed
// loosely at this one boundary and left strict everywhere else in this file.
type PptxSlide = PptxGenJS.Slide;
type TextRunOptions = Record<string, unknown>;
type TextItem = { text: string; options?: TextRunOptions };

const THEME_DEFAULTS: Theme = {
  navy: "1B2A4A",
  gold: "C9A227",
  background: "FFFFFF",
  border: "D9D9D9",
};

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

// Seqta's bracket tags use British "centre"; both spellings are mapped here.
const POSITION_X: Record<string, number> = {
  left: 0.5,
  center: (SLIDE_W - 4) / 2,
  centre: (SLIDE_W - 4) / 2,
  right: SLIDE_W - 4.5,
};
const SIZE_WIDTH: Record<string, number> = { small: 3, medium: 4.5, large: 6 };

function imageBox(position: string | null, size: string | null): { x: number; w: number } {
  const w = (size && SIZE_WIDTH[size]) || SIZE_WIDTH.medium;
  const x = (position && POSITION_X[position]) ?? POSITION_X.right;
  return { x: x as number, w: w as number };
}

/** Reads natural pixel dimensions of a data: URL image via a throwaway <img>. */
function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

interface ImageBox {
  x: number;
  w: number;
  h: number;
}

/** Estimates an image's rendered box (x, w, h), using the real file's aspect
 * ratio when available and falling back to a fixed ratio for a missing
 * resource (still needs a placeholder-sized box in the flow). */
async function estimateImageBox(image: {
  position: string | null;
  size: string | null;
  dataUrl: string | null;
}): Promise<ImageBox> {
  const box = imageBox(image.position, image.size);
  let h = box.w * 0.66;
  if (image.dataUrl) {
    const dims = await loadImageDimensions(image.dataUrl);
    if (dims && dims.width && dims.height) h = box.w * (dims.height / dims.width);
  }
  return { x: box.x, w: box.w, h };
}

// --- Overflow-safe text flow (identical formula to the original generator) ---
const CHAR_WIDTH_IN = 0.105;
const LINE_HEIGHT_IN = 0.24;
const CONTENT_TOP = 1.5;
const CONTENT_BOTTOM = SLIDE_H - 0.5;

function estimateParagraphHeight(text: string, textW: number): number {
  const charsPerLine = Math.max(10, Math.floor(textW / CHAR_WIDTH_IN));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.max(0.4, lines * LINE_HEIGHT_IN + 0.1);
}

function estimateBulletListHeight(items: string[]): number {
  return 0.4 * items.length + 0.2;
}

function estimateTableHeight(rows: string[][]): number {
  return 0.5 * rows.length + 0.3;
}

type ImageItem = Extract<GenItem, { kind: "image" }>;

type FlowBlock =
  | { kind: "paragraph"; data: TextRun[]; height: number }
  | { kind: "bulletList"; data: string[]; height: number }
  | { kind: "table"; data: string[][]; height: number }
  | { kind: "resource"; data: string; height: number }
  | { kind: "imageRow"; data: ImageItem[]; boxes: ImageBox[]; height: number };

type GroupedItem = GenItem | { kind: "imageRow"; images: ImageItem[] };

async function addContentSlide(
  pptx: PptxGenJS,
  theme: Theme,
  slide: Extract<GenSlide, { type: "content" }>,
): Promise<void> {
  // Text always uses the full width — images render on their own row (see
  // below) rather than sharing a row with a permanently-reserved side column.
  const textW = SLIDE_W - 1;

  // Consecutive image items (nothing else between them) collapse into one
  // row block, so they render side by side instead of each claiming a
  // full-height row of its own — matching how they actually sat together.
  const groupedItems: GroupedItem[] = [];
  for (const item of slide.items) {
    const prev = groupedItems[groupedItems.length - 1];
    if (item.kind === "image" && prev && "images" in prev) {
      prev.images.push(item);
    } else if (item.kind === "image") {
      groupedItems.push({ kind: "imageRow", images: [item] });
    } else {
      groupedItems.push(item);
    }
  }

  // Build the flow queue IN ORDER — this is what keeps content in the same
  // sequence it appeared in the lesson (paragraph -> its list -> its table ->
  // an inline image -> next paragraph, etc).
  const flowBlocks: FlowBlock[] = [];
  for (const item of groupedItems) {
    if (item.kind === "paragraph") {
      const text = item.paragraph.map((run) => run.text).join("");
      flowBlocks.push({
        kind: "paragraph",
        data: item.paragraph,
        height: estimateParagraphHeight(text, textW),
      });
    } else if (item.kind === "bulletList") {
      flowBlocks.push({
        kind: "bulletList",
        data: item.bulletList,
        height: estimateBulletListHeight(item.bulletList),
      });
    } else if (item.kind === "table") {
      flowBlocks.push({ kind: "table", data: item.table, height: estimateTableHeight(item.table) });
    } else if (item.kind === "resource") {
      flowBlocks.push({ kind: "resource", data: item.resource, height: 1.0 });
    } else if ("images" in item) {
      const boxes = await Promise.all(item.images.map((i) => estimateImageBox(i.image)));
      const height = Math.max(...boxes.map((b) => b.h)) + 0.15;
      flowBlocks.push({ kind: "imageRow", data: item.images, boxes, height });
    }
  }

  let s: PptxSlide | null = null;
  let textY = CONTENT_TOP;
  let continuationCount = 0;

  // Consecutive paragraph blocks that land on the same slide are buffered and
  // flushed as ONE shape (one paragraph per line via breakLine) rather than
  // each getting its own addText() call. Splitting/overflow is unaffected:
  // each paragraph's height is still accounted for individually above.
  let paragraphBuffer: { runs: TextItem[]; height: number }[] = [];
  let paragraphBufferY: number | null = null;

  function flushParagraphBuffer() {
    if (paragraphBuffer.length === 0 || !s) return;
    const runs: TextItem[] = [];
    paragraphBuffer.forEach((p, idx) => {
      // p.runs entries are already {text, options} — options (hyperlink/
      // color/underline) were computed once when the paragraph was first
      // queued below; copy that forward rather than re-deriving it here.
      p.runs.forEach((run, runIdx) => {
        const options: TextRunOptions = { ...run.options };
        if (runIdx === p.runs.length - 1 && idx < paragraphBuffer.length - 1) {
          options.breakLine = true; // start a new line for the next paragraph
        }
        runs.push({ text: run.text, options });
      });
    });
    const totalHeight = paragraphBuffer.reduce((sum, p) => sum + p.height, 0);
    s.addText(runs as never, {
      x: 0.5,
      y: paragraphBufferY ?? CONTENT_TOP,
      w: textW,
      h: totalHeight,
      fontSize: 14,
      color: "333333",
      fontFace: "Arial",
      valign: "top",
    });
    paragraphBuffer = [];
    paragraphBufferY = null;
  }

  function startSlide() {
    s = pptx.addSlide();
    s.background = { color: theme.background };

    const title = continuationCount === 0 ? slide.title : `${slide.title} (cont.)`;
    s.addText(title, {
      x: 0.5,
      y: 0.4,
      w: SLIDE_W - 1,
      h: 0.9,
      fontSize: 28,
      bold: true,
      color: theme.navy,
      fontFace: "Arial",
    });
    textY = CONTENT_TOP;
  }

  startSlide();

  for (const block of flowBlocks) {
    if (textY > CONTENT_TOP && textY + block.height > CONTENT_BOTTOM) {
      flushParagraphBuffer(); // onto the slide that's about to be left behind
      continuationCount += 1;
      startSlide();
    }
    if (!s) continue;
    // `s` is reassigned inside the startSlide() closure above, so TypeScript
    // can't carry the `!s` narrowing across the calls below — alias it to a
    // const once per iteration instead of repeating a non-null assertion.
    const currentSlide: PptxSlide = s;

    if (block.kind === "paragraph") {
      const runs: TextItem[] = block.data.map((run) => {
        const options: TextRunOptions = {};
        if (run.kind === "link") {
          options.hyperlink = { url: run.url };
          options.color = "0563C1";
          options.underline = true;
        }
        return { text: run.text, options };
      });
      if (paragraphBuffer.length === 0) paragraphBufferY = textY;
      paragraphBuffer.push({ runs, height: block.height });
    } else if (block.kind === "bulletList") {
      flushParagraphBuffer();
      const bulletItems: TextItem[] = block.data.map((item) => ({
        text: item,
        options: { bullet: true },
      }));
      currentSlide.addText(bulletItems as never, {
        x: 0.5,
        y: textY,
        w: textW,
        h: block.height,
        fontSize: 14,
        color: "333333",
        fontFace: "Arial",
      });
    } else if (block.kind === "table") {
      flushParagraphBuffer();
      const rows = block.data.map((row) =>
        row.map((cell) => ({ text: cell, options: { fontSize: 12 } })),
      );
      currentSlide.addTable(
        rows as never,
        {
          x: 0.5,
          y: textY,
          w: textW,
          border: { type: "solid", color: theme.border, pt: 1 },
          fill: { color: "FFFFFF" },
        } as never,
      );
    } else if (block.kind === "resource") {
      flushParagraphBuffer();
      currentSlide.addText(`Attached resource\n${block.data}`, {
        x: 0.5,
        y: textY,
        w: 4,
        h: 0.8,
        fontSize: 12,
        color: theme.navy,
        fontFace: "Arial",
        fill: { color: "FFFFFF" },
        line: { color: theme.border, width: 1 },
        align: "center",
        valign: "middle",
      } as never);
    } else if (block.kind === "imageRow") {
      flushParagraphBuffer();
      // A single image keeps its own left/right/centre position from the
      // bracket tag. Two or more consecutive images ignore individual
      // positions and just lay out left to right from the margin.
      const gap = 0.25;
      const firstBox = block.boxes[0];
      let x = block.data.length === 1 && firstBox ? firstBox.x : 0.5;
      for (let i = 0; i < block.data.length; i++) {
        const item = block.data[i];
        const box = block.boxes[i];
        if (!item || item.kind !== "image" || !box) continue;
        const image = item.image;
        if (!image.dataUrl) {
          currentSlide.addText(
            `Missing resource: ${image.filename || "unknown"} — insert manually`,
            {
              x,
              y: textY,
              w: box.w,
              h: box.h,
              fontSize: 11,
              color: "B00020",
              italic: true,
              align: "center",
              valign: "middle",
              line: { color: "B00020", width: 1 },
            } as never,
          );
        } else {
          currentSlide.addImage({ data: image.dataUrl, x, y: textY, w: box.w, h: box.h });
        }
        x += box.w + gap;
      }
    }

    textY += block.height;
  }

  flushParagraphBuffer(); // render whatever paragraphs were still buffered at the end
}

function addVideoSlide(
  pptx: PptxGenJS,
  theme: Theme,
  slide: Extract<GenSlide, { type: "video" }>,
): void {
  const s = pptx.addSlide();
  s.background = { color: theme.navy };

  s.addText(slide.title, {
    x: 0.5,
    y: 0.6,
    w: SLIDE_W - 1,
    h: 0.9,
    fontSize: 26,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });

  s.addText("▶  Watch Video", {
    x: "31%",
    y: "40%",
    w: "38%",
    h: "16%",
    fontSize: 20,
    bold: true,
    color: theme.navy,
    fill: { color: theme.gold },
    align: "center",
    valign: "middle",
    hyperlink: { url: slide.url },
  } as never);

  s.addText(slide.url, {
    x: "5%",
    y: "60%",
    w: "90%",
    h: "7%",
    fontSize: 11,
    color: "CCCCCC",
    align: "center",
  });
}

/** Resolves once the browser download has been triggered. */
export async function generatePptx(
  data: GenerationInput,
  theme: Partial<Theme> = {},
): Promise<void> {
  const resolvedTheme: Theme = { ...THEME_DEFAULTS, ...theme };

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "SLIDEFORGE_16x9", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "SLIDEFORGE_16x9";

  for (const slide of data.slides) {
    if (slide.type === "video") {
      addVideoSlide(pptx, resolvedTheme, slide);
    } else {
      await addContentSlide(pptx, resolvedTheme, slide);
    }
  }

  const fileName = `${data.outputName || "Presentation"}.pptx`;
  await pptx.writeFile({ fileName });
}
