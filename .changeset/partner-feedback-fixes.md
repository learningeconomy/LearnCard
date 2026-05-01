---
'@learncard/partner-connect': minor
'@learncard/types': minor
'@learncard/network-brain-service': patch
---

Partner Connect SDK + brain service: schema validation hardening, ergonomics, typed errors.

**SDK (`@learncard/partner-connect`)**

- Added `PartnerConnectError` class (extends `Error`, implements `LearnCardError`). All SDK rejections now use it, unlocking `if (err instanceof PartnerConnectError)` and exhaustive `switch` on `err.code`. The legacy `{ code, message }` shape is preserved so existing call sites keep working.
- `SummaryCredentialNextStep.keywords` is now optional. Apps that have no taxonomy data can omit the field entirely instead of passing a struct of `null` fields.

**Types (`@learncard/types`)**

- `SummaryCredentialDataValidator.nextSteps[].keywords` is now optional, matching the SDK type and removing pointless boilerplate from 90% of `sendAiSessionCredential` call sites.

**Brain service (`@learncard/network-brain-service`)**

- The `/app-store/event` route now deep-validates the `event` payload against `AppEventValidator` (the existing discriminated union from `@learncard/types`). Previously, the route accepted `z.record(z.string(), z.unknown())` and trusted handlers to parse fields manually, which meant malformed events (e.g. wrong `summaryData` shape on `send-ai-session-credential`) silently produced broken credentials. Malformed events now fail fast with a clear zod error at the route boundary.
