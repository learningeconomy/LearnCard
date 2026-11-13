---
'@learncard/cli': minor
---

Publish the CLI as one self-contained file. `npx @learncard/cli` now installs a single package of about 10 MB instead of roughly 1,170 packages and 1.2 GB, with no EBADENGINE or deprecation warnings, and starts about twice as fast. Commands, flags and output are unchanged.

Also fixes `--json` output being cut off at 8 KB on Node 20 when another process captured it, and the CLI failing to start on Node 20 releases that cannot `require()` ES modules.

Adds `bun run build:binary` to compile standalone executables that need no Node.js install.
