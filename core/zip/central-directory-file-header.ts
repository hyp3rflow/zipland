import { ZIP_CENTRAL_DIRECTORY } from "./const.ts";

export interface CentralDirectoryFileHeader {
  name: string;
  compression: number;
  localOffset: number;
  compressedSize: number;
  uncompressedSize: number;
}
export async function getCDirView(
  file: Deno.FsFile,
  offset: number,
): Promise<DataView> {
  const temp = new Uint8Array(ZIP_CENTRAL_DIRECTORY.MIN_LENGTH);
  const tempView = new DataView(temp.buffer);
  await file.seek(offset, Deno.SeekMode.Start);
  await file.read(temp);
  const size = getCDirSize(tempView);
  const cdir = new Uint8Array(size);
  await file.seek(offset, Deno.SeekMode.Start);
  await file.read(cdir);
  return new DataView(cdir.buffer);
}
export function getCDirSize(view: DataView): number {
  return ZIP_CENTRAL_DIRECTORY.MIN_LENGTH + view.getUint16(28, true) +
    view.getUint16(30, true) + view.getUint16(32, true);
}
export function getCDirectoryObject(
  view: DataView,
): CentralDirectoryFileHeader {
  const compression = view.getUint8(
    ZIP_CENTRAL_DIRECTORY.COMPRESSION_OFFSET,
  );
  const nameLength = view.getUint16(
    ZIP_CENTRAL_DIRECTORY.NAME_LENGTH_OFFSET,
    true,
  );
  const name = new TextDecoder().decode(
    view.buffer.slice(
      ZIP_CENTRAL_DIRECTORY.FILE_NAME_OFFSET,
      ZIP_CENTRAL_DIRECTORY.FILE_NAME_OFFSET + nameLength,
    ),
  );
  const localOffset = view.getUint32(
    ZIP_CENTRAL_DIRECTORY.LOCAL_FILE_HEADER_OFFSET,
    true,
  );
  const compressedSize = view.getUint32(
    ZIP_CENTRAL_DIRECTORY.COMPRESSED_SIZE_OFFSET,
    true,
  );
  const uncompressedSize = view.getUint32(
    ZIP_CENTRAL_DIRECTORY.UNCOMPRESSED_SIZE_OFFSET,
    true,
  );
  const cdir = {
    compression,
    name,
    localOffset,
    compressedSize,
    uncompressedSize,
  };
  return cdir;
}
