---
"@learncard/create-http-bridge": patch
---

Upgrade `simple-git` to 4.0.2 to resolve GHSA-x6jw-m9v5-85vh (CVE-2026-102828), where the unsafe-operation guard did not block git trailer command configuration. The scaffold clone behaves the same; the CLI now uses the named `simpleGit` export because v4 removed the default export.
