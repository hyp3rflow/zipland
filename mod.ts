import {
  ZIP_CENTRAL_DIRECTORY_RECORDS,
  ZIP_CENTRAL_HEADER_MIN_LENGTH,
  ZIP_CENTRAL_HEADER_SIGNATURE,
} from "./const.ts";

interface FsOffset {
  offset: number;
  whence: Deno.SeekMode;
}

const file = await Deno.open("./test/test.zip");

await disassembleZip(file);

async function disassembleZip(file: Deno.FsFile) {
  const centralHeaderOffset = await getCentralHeaderOffset(file);
  if (!centralHeaderOffset) return;
  const recordCount = await getRecordCount(file, centralHeaderOffset);
  for (let i = 0; i < recordCount; i++) {
  }
}

async function getRecordCount(
  file: Deno.FsFile,
  offset: FsOffset,
): Promise<number> {
  const u8s = new Uint8Array(2);
  await file.seek(offset.offset + ZIP_CENTRAL_DIRECTORY_RECORDS, offset.whence);
  await file.read(u8s);
  return new DataView(u8s.buffer).getUint16(0, true);
}

async function getCentralHeaderOffset(
  file: Deno.FsFile,
): Promise<FsOffset | null> {
  const u8s = new Uint8Array(4);
  const view = new DataView(u8s.buffer);
  const { size } = await file.stat();
  let i = ZIP_CENTRAL_HEADER_MIN_LENGTH;
  if (size >= ZIP_CENTRAL_HEADER_MIN_LENGTH) {
    do {
      await file.seek(-i, Deno.SeekMode.End);
      await file.read(u8s);
      if (view.getUint32(0, true) === ZIP_CENTRAL_HEADER_SIGNATURE) {
        return { offset: -i, whence: Deno.SeekMode.End };
      }
    } while (i++);
  }
  return null;
}

interface LocalFileHeader {}
async function getLocalFileHeader(file: Deno.FsFile): Promise<LocalFileHeader> {
  const signature = new Uint8Array(4);
  await file.read(signature);

  const version = new Uint8Array(2);
  await file.read(version);

  const flag = new Uint8Array(2);
  await file.read(flag);

  const method = new Uint8Array(2);
  await file.read(method);

  const lastModifiedTime = new Uint8Array(2);
  await file.read(lastModifiedTime);
  const lastModifiedTime_uint = new DataView(lastModifiedTime.buffer).getUint16(
    0,
    true,
  );

  const lastModifiedDate = new Uint8Array(2);
  await file.read(lastModifiedDate);
  const lastModifiedDate_uint = new DataView(lastModifiedDate.buffer).getUint16(
    0,
    true,
  );

  const crc32 = new Uint8Array(4);
  await file.read(crc32);

  const compSize = new Uint8Array(4);
  await file.read(compSize);
  const compSize_uint = new DataView(compSize.buffer).getUint32(0, true);

  const decompSize = new Uint8Array(4);
  await file.read(decompSize);
  const decompSize_uint = new DataView(decompSize.buffer).getUint32(0, true);

  const nameLengthU8s = new Uint8Array(2);
  await file.read(nameLengthU8s);
  const nameLength = new DataView(nameLengthU8s.buffer).getUint16(0, true);

  const fieldLengthU8s = new Uint8Array(2);
  await file.read(fieldLengthU8s);
  const fieldLength = new DataView(fieldLengthU8s.buffer).getUint16(0, true);

  const nameU8s = new Uint8Array(nameLength);
  await file.read(nameU8s);
  const name = new TextDecoder().decode(nameU8s);

  const field = new Uint8Array(fieldLength);
  await file.read(field);

  const header = {
    signature,
    version,
    flag,
    method,
    lastModifiedTime_uint,
    lastModifiedDate_uint,
    crc32,
    compSize_uint,
    decompSize_uint,
    nameLength,
    fieldLength,
    name,
    field,
  };
  return header;
}
