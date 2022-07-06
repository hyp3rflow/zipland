interface FileInfo {
  size: number;
}
export type File = Deno.Reader & Deno.Seeker & {
  stat(): Promise<FileInfo>;
};
export interface FsOffset {
  offset: number;
  whence: Deno.SeekMode;
}
