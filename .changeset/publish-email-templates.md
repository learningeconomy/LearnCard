---
'@learncard/email-templates': patch
---

Publish to npm so partner repos can install `@learncard/email-templates` as a regular dependency. The package was previously marked `private` and skipped by the release pipeline; this also adds a `files` allowlist so only the built `dist/` is included in the tarball.
