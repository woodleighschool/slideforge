// oxlint-disable-next-line no-unassigned-import -- React must load before its module is augmented.
import "react";

declare module "react" {
  interface InputHTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}

declare global {
  interface File {
    readonly webkitRelativePath: string;
  }
}
