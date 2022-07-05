import { extname, posix } from "https://deno.land/std@0.146.0/path/mod.ts";
import { red } from "https://deno.land/std@0.146.0/fmt/colors.ts";
import { contentType } from "https://deno.land/std@0.146.0/media_types/mod.ts";
import {
  Status,
  STATUS_TEXT,
} from "https://deno.land/std@0.146.0/http/http_status.ts";
import { disassembleZip, ZipFile, ZipFiles } from "../zip/mod.ts";
import { serve, ServeInit } from "https://deno.land/std@0.146.0/http/server.ts";

export interface ServeZipOptions extends ServeInit, ServeZipFilesOptions {}
export async function serveZip(path: string, opts: ServeZipOptions = {}) {
  const zip = await Deno.open(path);
  const zipfiles = await disassembleZip(zip);
  if (zipfiles) {
    serve((req: Request): Promise<Response> => {
      return serveZipFiles(req, zipfiles, opts);
    }, opts);
  }
}

export interface ServeZipFilesOptions {
  urlRoot?: string;
  quiet?: string;
}
export async function serveZipFiles(
  req: Request,
  zipfiles: ZipFiles,
  opts: ServeZipFilesOptions = {},
) {
  let response: Response;
  try {
    let normalizedPath = normalizeURL(req.url);
    if (opts.urlRoot) {
      if (normalizedPath.startsWith("/" + opts.urlRoot)) {
        normalizedPath = normalizedPath.replace("/" + opts.urlRoot, "");
      } else {
        throw new Deno.errors.NotFound();
      }
    }
    if (normalizedPath.startsWith("/")) {
      normalizedPath = normalizedPath.replace("/", "");
    }
    if (zipfiles.has(normalizedPath)) {
      response = await serveZipFile(req, zipfiles.get(normalizedPath)!);
    } else {
      throw new Deno.errors.NotFound();
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error("[non-error thrown]");
    if (!opts.quiet) console.error(red(err.message));
    response = await serveFallback(req, err);
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
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
function setBaseHeaders(): Headers {
  const headers = new Headers();
  headers.set("server", "deno");

  // Set "accept-ranges" so that the client knows it can make range requests on future requests
  headers.set("accept-ranges", "bytes");
  headers.set("date", new Date().toUTCString());

  return headers;
}

// from https://deno.land/std@0.146.0/http/file_server.ts
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
function normalizeURL(url: string): string {
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

// from https://deno.land/std@0.146.0/http/file_server.ts
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
function serveFallback(_req: Request, e: Error): Promise<Response> {
  if (e instanceof URIError) {
    return Promise.resolve(
      new Response(STATUS_TEXT[Status.BadRequest], {
        status: Status.BadRequest,
        statusText: STATUS_TEXT[Status.BadRequest],
      }),
    );
  } else if (e instanceof Deno.errors.NotFound) {
    return Promise.resolve(
      new Response(STATUS_TEXT[Status.NotFound], {
        status: Status.NotFound,
        statusText: STATUS_TEXT[Status.NotFound],
      }),
    );
  }
  return Promise.resolve(
    new Response(STATUS_TEXT[Status.InternalServerError], {
      status: Status.InternalServerError,
      statusText: STATUS_TEXT[Status.InternalServerError],
    }),
  );
}
