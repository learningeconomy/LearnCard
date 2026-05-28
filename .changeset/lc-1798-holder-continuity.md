---
'@learncard/cli': minor
'@learncard/holder-continuity': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
'@learncard/types': minor
---

feat: [LC-1798] Holder continuity export, restore, and metadata

Adds a new `@learncard/holder-continuity` package for creating encrypted holder continuity bundles, reading them back, importing credentials into a fresh wallet, and restoring the original wallet directly from the exported private-key seed.

Updates `@learncard/cli` to consume the new package and expose REPL helpers for export, import, and restore.

Adds holder export metadata types, an authenticated brain-service route, and a network plugin method for exporting consent records and transaction history without exposing credential payloads or key material from the service.

Adds bounded status-list fetching, optional verify-before-import support, bundle size guards, and capped holder metadata pagination.
