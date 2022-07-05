import { serve } from "https://deno.land/std/http/mod.ts";
import { disassembleZip, serveZipFiles } from "../mod.ts";

const file = await Deno.open("./test.zip");
const zip = await disassembleZip(file);
if (zip) {
  const handler = async (req: Request): Promise<Response> => {
    const pathname = new URL(req.url).pathname;
    if (pathname.startsWith("/file")) {
      // urlRoot option makes: request /file/hello.txt -> /hello.txt
      return serveZipFiles(req, zip, { urlRoot: "file" });
    }
    // serve other things too!
    return new Response("Go to valid link!", { status: 200 });
  };
  serve(handler);
}
