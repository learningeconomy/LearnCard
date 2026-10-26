---
'learn-card-base': patch
'learn-card-app': patch
---

fix: [LC-2258] Preserve Passport categories across private-link previews and shared collections, including wallet-index categories such as Work Experience, Resume, and Professional Title. Ignore unrecognized category hints and infer their display category from the original credential. Use a static own-key lookup for category hints instead of scanning the allowlist for each credential.
