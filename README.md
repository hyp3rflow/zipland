# zipland

Serve file server with one-single zip file in Deno.

## Support

### zip

- just zip32 with deflated or uncompressed

### serving

- plaintext
- deflate

## Examples

You can serve your zip file with just single line.

```typescript
import { serveZip } from "https://deno.land/x/zipland/mod.ts";

serveZip("./my.zip");
```

Or you can serve the zip file in your own serve implementation.

```typescript
import { serve } from "https://deno.land/std/http/mod.ts";
import {
  disassembleZip,
  serveZipFiles,
} from "https://deno.land/x/zipland/mod.ts";

const file = await Deno.open(path);
const zip = await disassembleZip(zip);
if (zip) {
  const handler = (req: Request): Promise<Response> => {
    const pathname = new URL(req.url).pathname;
    switch (pathname) {
      case "/file": {
        return serveZipFiles(req, zip, { urlRoot: "/file" });
      }
    }
    // serve other things too!
  };
  serve(handler);
}
```

You can see and run above example in `/test` directory
