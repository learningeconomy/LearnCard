---
"learn-card-app": minor
"learn-card-base": patch
"@learncard/react": patch
"@learncard/types": patch
---

Add a streamlined "Create Credential" flow (simple send), gated behind the `enableSimpleSend` flag.

A new `/issue` page lets users issue a standards-pure OBv3 credential from one screen — from scratch, from an imported source (link, file, JSON, or Credential Engine ID), or by resending a credential they already manage — with a live card preview and self / specific-people / claim-link recipients.

Also includes shared credential-card fixes used across the wallet: achievement-type-aware subtitles and display types, corrected category mapping, redesigned "verified source" alignments, and image/placeholder fallbacks. `@learncard/types` gains an optional `created` field on the boost validator.
