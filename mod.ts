import { serve } from "https://deno.land/std@0.146.0/http/mod.ts";
import { disassembleZip, serveZipFiles } from "./core/mod.ts";

export * from "./core/mod.ts";

if (import.meta.main) {
  const file = await Deno.open("./test/test.zip");
  const result = await disassembleZip(file);
  if (result) {
    const handler = (req: Request): Promise<Response> => {
      return serveZipFiles(req, result);
    };
    serve(handler, { port: 8080, hostname: "0.0.0.0" });
  }
}
