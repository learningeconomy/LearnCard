---
'learn-card-app': minor
'learn-card-base': minor
---

ClassLink account continuity (LC-2409), app side. A "Keep your LearnCard after school" step (personal email, code, then a passkey or recovery phrase) appears at transcript arrival, on School Connect and as a dashboard banner, behind the new `classlinkKeepAccount` feature flag (off by default). `PersonalEmailPrompt` now follows the server's account-continuity decision instead of client-only student and minor checks. `useClassLinkAccountContinuity` undoes a pending sign-in email change (`reconcilePending`) while loading, at most once a minute per account, and signs the device back in with its custom token (`applySignInToken`). A change refused for want of a recent sign-in says so and offers "Sign in again". The login page's personal-email hint shows only with the keep-account flags on.
