# bud-embedded

An extension for `bud` to aid in building web applications for embedded systems.

This extension configures `bud` to build compressed, concatenated SFSPAs (single file, single page applications) which can be statically linked into firmware binaries without the need for a filesystem.

The primary use case is on-chip web applications for eg. a device administration panel.

This extension will:

- **Emit a single HTML file containing compiled JS and CSS inline (when `bud.isProduction`)** - For easy static linking and referencing from within firmware
- **Optionally compress (gzip / deflate) compiled application** - All major browsers support `Content-Encoding`, so we can compress the application at compile time to save both flash space and heap allocations
- **Integrate [`cross-def`](https://github.com/talss89/cross-def) symbol generation for JS and C** - Reference C symbols from within the web app via `bud.define()`
- **Add a `bud.proxy` punchthrough mode to enable hot-reloading with a physical device under test** - Use Bud's HMR server, but forward any other requests directly to the device, allowing quick web development against actual hardware
- **Access `kconfig` parameters from JS via `bud.define()`**

Ideas requiring more exploration:

- Generate `.S` assembly code from emitted assets directly
- Following on from the above, generate `.S` assembly for the entire bud manifest
- Or, perhaps: Is there a way we can efficiently embed binary data in HTML? Can we embed the entire asset manifest in HTML? Base64 and data-uri is an option, but inefficient. How big are LZMA compression implementations in Javascript? Can we use base64+LZMA?