export interface FsOffset {
  offset: number;
  whence: Deno.SeekMode;
}

export * from "./central-directory-file-header.ts";
export * from "./end-of-central-directory-record.ts";
export * from "./local-file-header.ts";
