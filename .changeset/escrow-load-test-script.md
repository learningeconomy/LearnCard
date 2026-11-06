---
"@learncard/escrow-canary": patch
---

Add a staging-only escrow load-test script (`scripts/load.ts`) that runs the app's automatic escrow enrolment and PIN recovery at a controlled rate, with fail-closed guards (staging host, test email domain, shared-Firebase opt-in, user/email caps) and manifest-only cleanup.
