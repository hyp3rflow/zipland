import { ZIP_LOCAL_FILE_HEADER } from "./const.ts";
import { File } from "../types.ts";

export interface LocalFileHeader {
  signature: number;
  version: number;
  flag: number;
  compressionMethod: number;
  lastModifiedTime: number;
  lastModifiedDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
}
export async function getLFHeaderView(file: File, offset: number) {
  const temp = new Uint8Array(ZIP_LOCAL_FILE_HEADER.MIN_LENGTH);
  const tempView = new DataView(temp.buffer);
  await file.seek(offset, Deno.SeekMode.Start);
  await file.read(temp);
  const size = getLFHeaderSize(tempView);
  const lfheader = new Uint8Array(size);
  await file.seek(offset, Deno.SeekMode.Start);
  await file.read(lfheader);
  return new DataView(lfheader.buffer);
}
export function getLFHeaderSize(view: DataView) {
  return ZIP_LOCAL_FILE_HEADER.MIN_LENGTH + view.getUint16(26, true) +
    view.getUint16(28, true);
}
export function getLFHeaderObject(view: DataView): LocalFileHeader {
  return {
    signature: view.getUint32(0, true),
    version: view.getUint16(4, true),
    flag: view.getUint16(6, true),
    compressionMethod: view.getUint16(8, true),
    lastModifiedTime: view.getUint16(10, true),
    lastModifiedDate: view.getUint16(12, true),
    crc32: view.getUint32(14, true),
    compressedSize: view.getUint32(18, true),
    uncompressedSize: view.getUint32(22, true),
    fileNameLength: view.getUint16(26, true),
    extraFieldLength: view.getUint16(28, true),
  };
}
