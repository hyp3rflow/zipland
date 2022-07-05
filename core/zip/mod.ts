import { LimitedReader } from "https://deno.land/std@0.146.0/io/readers.ts";
import { readAll } from "https://deno.land/std@0.146.0/streams/conversion.ts";
import { ZIP_LOCAL_FILE_HEADER } from "./const.ts";
import {
  CentralDirectoryFileHeader,
  getCDirectoryObject,
  getCDirView,
} from "./central-directory-file-header.ts";
import {
  getCRecordObject,
  getCRecordView,
} from "./end-of-central-directory-record.ts";
import { getLFHeaderObject, getLFHeaderView } from "./local-file-header.ts";

export interface ZipInfo {
  name: string;
  crc32: number;
  offset: number;
  compressed: number;
  uncompressed: number;
  compression: number;
}

export async function disassembleZip(
  file: Deno.FsFile,
): Promise<ZipFiles | null> {
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
  const zipinfos = await getZipInfos(file, cdirs);
  const zipfiles = await getZipFiles(file, zipinfos);
  return zipfiles;
}

async function getZipInfos(
  file: Deno.FsFile,
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

export interface ZipFile {
  compressed: boolean;
  data: Uint8Array;
  info: ZipInfo;
}
export type ZipFiles = Map<string, ZipFile>;
async function getZipFiles(
  file: Deno.FsFile,
  zipinfos: ZipInfo[],
): Promise<ZipFiles> {
  const zipfiles: Map<string, ZipFile> = new Map();
  for (const zipinfo of zipinfos) {
    file.seek(zipinfo.offset, Deno.SeekMode.Start);
    const reader = new LimitedReader(file, zipinfo.compressed);
    const data = await readAll(reader);
    zipfiles.set(zipinfo.name, {
      compressed: zipinfo.compression === 8,
      data,
      info: zipinfo,
    });
  }
  return zipfiles;
}
