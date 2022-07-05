export type File = Deno.Reader & Deno.Seeker;
export interface FsOffset {
  offset: number;
  whence: Deno.SeekMode;
}
