---
"learn-card-app": patch
"scoutpass-app": patch
"learn-card-base": patch
---

fix: [LC-2294] Remove routine credential loading text and continuation buttons while preserving automatic pagination and retry.

Keep screen-reader announcement regions mounted while idle so search and loading failures can be announced without restoring routine visible status text.
