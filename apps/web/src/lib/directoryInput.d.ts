// `webkitdirectory` lets a plain <input type="file"> pick a whole folder
// instead of individual files. It's non-standard (hence the vendor prefix)
// but has been supported by every major browser for years — it's just not
// part of TypeScript's DOM/React typings, so it's declared here rather than
// suppressed with a comment at each call site.
//
// The bare import below is load-bearing: without it, TypeScript treats
// `declare module "react"` as a brand-new ambient module rather than an
// augmentation of the real one, which silently wipes out every actual React
// export project-wide.
// oxlint-disable-next-line no-unassigned-import -- side-effect-only import is the documented way to make `declare module` augment rather than replace
import "react";

declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

// The import above turned this file into a module, so these need an
// explicit `declare global` to still merge into the global DOM lib types.
declare global {
  interface HTMLInputElement {
    readonly webkitdirectory: boolean;
  }

  interface File {
    /** Set by the browser when the file came from a webkitdirectory picker;
     * empty string otherwise (e.g. a single file chosen normally). */
    readonly webkitRelativePath: string;
  }
}
