import { serveZip } from "./core/mod.ts";

export * from "./core/mod.ts";

if (import.meta.main) {
  serveZip("./test/test.zip");
}
