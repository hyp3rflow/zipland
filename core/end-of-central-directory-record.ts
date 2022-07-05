import { ZIP_CENTRAL_RECORD } from "./const.ts";
import { FsOffset } from "./mod.ts";

export async function getCRecordView(
  file: Deno.FsFile,
): Promise<DataView | null> {
  const crecordOffset = await getCRecordOffset(file);
  if (!crecordOffset) return null;
  const crecord = new Uint8Array(22);
  const crview = new DataView(crecord.buffer);
  await file.seek(crecordOffset.offset, crecordOffset.whence);
  await file.read(crecord);
  return crview;
  async function getCRecordOffset(
    file: Deno.FsFile,
  ): Promise<FsOffset | null> {
    const u8s = new Uint8Array(4);
    const view = new DataView(u8s.buffer);
    const { size } = await file.stat();
    let i = ZIP_CENTRAL_RECORD.MIN_LENGTH;
    if (size >= ZIP_CENTRAL_RECORD.MIN_LENGTH) {
      do {
        await file.seek(-i, Deno.SeekMode.End);
        await file.read(u8s);
        if (view.getUint32(0, true) === ZIP_CENTRAL_RECORD.SIGNATURE) {
          return { offset: -i, whence: Deno.SeekMode.End };
        }
      } while (i++);
    }
    return null;
  }
}
export function getCRecordObject(view: DataView) {
  const sig = view.getUint32(0, true);
  const cdirCount = view.getUint16(8, true);
  const cdirSize = view.getUint32(12, true);
  const cdirOffset = view.getUint32(16, true);
  return {
    sig: sig === 0x06054b50,
    cdirCount,
    cdirSize,
    cdirOffset,
  };
}
