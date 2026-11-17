---
'learn-card-app': minor
'learn-card-base': minor
---

ClassLink account continuity (LC-2409), app side. A "Keep your LearnCard after school" step (personal email, code, then a passkey or recovery phrase) appears at transcript arrival, on School Connect and as a dashboard banner, behind the new `classlinkKeepAccount` feature flag (off by default). `PersonalEmailPrompt` now follows the server's account-continuity decision instead of client-only student and minor checks.
