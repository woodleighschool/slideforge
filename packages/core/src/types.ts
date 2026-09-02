// Shared types for the lesson-HTML -> slide -> PowerPoint pipeline. This
// package stays framework-free: it has no React/UI dependency, only DOM and
// Web APIs available in any browser tab.

export type BracketTag =
  | {
      type: "image";
      filename: string;
      position: string | null;
      size: string | null;
      extras: string[];
    }
  | { type: "resource"; filename: string }
  | { type: "embed"; url: string; mode: string };

export type ContentRun = { kind: "text"; text: string } | { kind: "tag"; tag: BracketTag };

export type TextRun = { kind: "plain"; text: string } | { kind: "link"; text: string; url: string };

export type LessonBlock =
  | { type: "slideTitle"; title: string }
  | { type: "paragraphText"; runs: TextRun[] }
  | { type: "bulletList"; items: string[] }
  | { type: "table"; rows: string[][] }
  | {
      type: "image";
      filename: string;
      position: string | null;
      size: string | null;
      extras: string[];
    }
  | { type: "resourceCard"; filename: string }
  | { type: "videoEmbed"; url: string; mode: string };

export type ContentItem =
  | { kind: "paragraph"; runs: TextRun[] }
  | { kind: "bulletList"; items: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "resourceCard"; filename: string }
  | { kind: "image"; filename: string; position: string | null; size: string | null };

export type ContentSlide = { type: "content"; title: string; items: ContentItem[] };
export type VideoSlide = { type: "video"; title: string; url: string };
export type AssembledSlide = ContentSlide | VideoSlide;

export interface ResourceEntry {
  relativePath: string;
  blob: Blob;
  dataUrl: string;
  bytes: number;
}
export type ResourceMap = Map<string, ResourceEntry>;

export interface ImportedResources {
  resources: ResourceMap;
  fileCount: number;
}

export type GenImage = {
  dataUrl: string | null;
  filename: string;
  position: string | null;
  size: string | null;
};

export type GenItem =
  | { kind: "paragraph"; paragraph: TextRun[] }
  | { kind: "bulletList"; bulletList: string[] }
  | { kind: "table"; table: string[][] }
  | { kind: "resource"; resource: string }
  | { kind: "image"; image: GenImage };

export type GenSlide =
  | { type: "content"; title: string; items: GenItem[] }
  | { type: "video"; title: string; url: string };

export interface GenerationInput {
  outputName: string;
  slides: GenSlide[];
  unmatchedImages: string[];
}

export interface Theme {
  navy: string;
  gold: string;
  background: string;
  border: string;
}

export interface BlockMeta {
  label: string;
  summary: string;
}
