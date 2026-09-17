---
"@learncard/types": minor
"learn-card-base": minor
"learn-card-app": patch
---

Route all sign-in flows through the provider-agnostic `SignInAdapter` and gate Firebase initialization on the configured auth provider.

- `SignInAdapter` gains `capabilities` and a complete method set (email link, phone OTP with adapter-held state and native event subscriptions, Google/Apple with a `reauthenticate` intent, custom token, OIDC credential, profile update, session persistence, delete account). The Firebase implementation moves the phone flow into `createFirebasePhoneAuth` and preloads `firebase/auth` at construction so social popups are not blocked by a cold chunk load.
- New `registerAuthProviderInitializer` / `initializeAuthProvider` in the provider registry: an app registers per-provider bootstrap and only the initializer matching `authProvider` runs.
- Both apps replace every direct `firebase/auth` and `@capacitor-firebase/authentication` call with adapter calls, drop `firebaseAuthStore` in favour of `authUserStore`, and move Firebase bootstrap into `src/auth/firebaseProviderInit.ts`. No behavior change for Firebase tenants; a tenant on another provider never initializes Firebase (`initializeApp` is gated behind the registered provider initializer).
