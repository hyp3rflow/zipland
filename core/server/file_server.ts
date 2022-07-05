import { extname, posix } from "https://deno.land/std@0.146.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.146.0/media_types/mod.ts";
import {
  Status,
  STATUS_TEXT,
} from "https://deno.land/std@0.146.0/http/http_status.ts";
import { ZipFile, ZipFiles } from "../zip/mod.ts";

// from https://deno.land/std@0.146.0/http/file_server.ts
export function normalizeURL(url: string): string {
  let normalizedUrl = url;

  try {
    //allowed per https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
    const absoluteURI = new URL(normalizedUrl);
    normalizedUrl = absoluteURI.pathname;
  } catch (e) {
    //wasn't an absoluteURI
    if (!(e instanceof TypeError)) {
      throw e;
    }
  }

  try {
    normalizedUrl = decodeURI(normalizedUrl);
  } catch (e) {
    if (!(e instanceof URIError)) {
      throw e;
    }
  }

  if (normalizedUrl[0] !== "/") {
    throw new URIError("The request URI is malformed.");
  }

  normalizedUrl = posix.normalize(normalizedUrl);
  const startOfParams = normalizedUrl.indexOf("?");

  return startOfParams > -1
    ? normalizedUrl.slice(0, startOfParams)
    : normalizedUrl;
}

export function serveFallback(_req: Request): Promise<Response> {
  return Promise.resolve(
    new Response(STATUS_TEXT[Status.NotFound], {
      status: Status.BadRequest,
      statusText: STATUS_TEXT[Status.NotFound],
    }),
  );
}

export async function serveZipFiles(req: Request, zipfiles: ZipFiles) {
  let response: Response;
  const normalizedPath = normalizeURL(req.url).slice(1);
  if (zipfiles.has(normalizedPath)) {
    response = await serveZipFile(req, zipfiles.get(normalizedPath)!);
  } else {
    response = await serveFallback(req);
  }
  return response!;
}

async function serveZipFile(req: Request, zipfile: ZipFile): Promise<Response> {
  const headers = setBaseHeaders();
  const contentTypeValue = contentType(extname(zipfile.info.name));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }
  headers.set("content-length", `${zipfile.data.byteLength}`);
  if (zipfile.compressed) {
    headers.set("content-encoding", "deflate");
  }
  return new Response(zipfile.data, {
    status: Status.OK,
    statusText: STATUS_TEXT[Status.OK],
    headers,
  });
}

// from https://deno.land/std@0.146.0/http/file_server.ts
function setBaseHeaders(): Headers {
  const headers = new Headers();
  headers.set("server", "deno");

  // Set "accept-ranges" so that the client knows it can make range requests on future requests
  headers.set("accept-ranges", "bytes");
  headers.set("date", new Date().toUTCString());

  return headers;
}
