import { readableStreamFromReader } from "https://deno.land/std@0.146.0/streams/conversion.ts";
import { LimitedReader } from "https://deno.land/std@0.146.0/io/readers.ts";

import {
  getLFHeaderObject,
  getLFHeaderView,
} from "./core/local-file-header.ts";
import {
  CentralDirectoryFileHeader,
  getCDirectoryObject,
  getCDirView,
} from "./core/central-directory-file-header.ts";
import {
  getCRecordObject,
  getCRecordView,
} from "./core/end-of-central-directory-record.ts";
import { ZIP_LOCAL_FILE_HEADER } from "./core/const.ts";

const file = await Deno.open("./test/test.zip");

const result = await disassembleZip(file);
console.log("result", result);

interface ZipInfo {
  name: string;
  crc32: number;
  offset: number;
  compressed: number;
  uncompressed: number;
  compression: number;
}

async function disassembleZip(file: Deno.FsFile) {
  const crview = await getCRecordView(file);
  if (!crview) return null;
  const crecord = getCRecordObject(crview);
  const cdirs: CentralDirectoryFileHeader[] = [];
  for (let i = 0, offset = crecord.cdirOffset; i < crecord.cdirCount; i++) {
    const cdirview = await getCDirView(file, offset);
    const cdir = getCDirectoryObject(cdirview);
    cdirs.push(cdir);
    offset += cdirview.byteLength;
  }
  const zipinfos = getZipInfos(cdirs);
  return zipinfos;
}

async function getZipInfos(
  cdirs: CentralDirectoryFileHeader[],
): Promise<ZipInfo[]> {
  const zipinfos: ZipInfo[] = [];
  for (const cdir of cdirs) {
    const lfview = await getLFHeaderView(file, cdir.localOffset);
    const lfheader = getLFHeaderObject(lfview);
    zipinfos.push({
      name: cdir.name,
      compression: cdir.compression,
      compressed: cdir.compressedSize,
      uncompressed: lfheader.uncompressedSize,
      offset: cdir.localOffset + ZIP_LOCAL_FILE_HEADER.MIN_LENGTH +
        lfheader.fileNameLength +
        lfheader.extraFieldLength,
      crc32: lfheader.crc32,
    });
  }
  return zipinfos;
}
