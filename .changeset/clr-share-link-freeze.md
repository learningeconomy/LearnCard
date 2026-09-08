---
'learn-card-app': patch
'learn-card-base': patch
'@learncard/didkit-plugin': patch
'@learncard/didkit-plugin-node': patch
'@learncard/credential-library': patch
---

fix: CLR transcript froze the app for ~90s on first open

- `ShareBoostLink` (compact) no longer generates a share link on mount. Generating a link signs a
  Verifiable Presentation that embeds the whole credential; for large CLRs with many blank nodes
  that JSON-LD canonicalization took ~80s on the main thread. The compact widget now shows a QR
  button and generates on tap.
- New `useCredentialVerification` hook (react-query) shares one `verifyCredential` across every
  component viewing the same credential; results are excluded from persisted cache.
- DIDKit plugins resolve the CLR v2 `context-2.0.1.json` from a bundled copy instead of fetching
  it from inside WASM on every verify/issue.
- Credential library: `bench:clr` benchmark (verify + share-VP timings per structural variant) and
  two Demo ISD transcript fixtures capturing the regression and the schema-safe fix.
