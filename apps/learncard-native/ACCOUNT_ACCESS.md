# Native account access

The October 16 account pass brings sign-in, email-code entry, recovery and the recovery/security overview into the native drawn design system. It changes presentation around the existing Firebase, account recovery and Keychain integration. It does not change account identity, cryptography, recovery services or the separate DIDKit investigation. See [the composition and actual screens](design/ACCOUNT_ACCESS_BRIEF.md).

## Flow and language

- Sign-in shows the configured dedicated test email and **Email me a code**. The address remains read-only; this experiment does not yet offer a general account chooser.
- Code entry uses one real six-digit field for paste, OTP autofill and VoiceOver. Localized digits normalize to ASCII; extra digits and non-digits are discarded. The action stays disabled until six digits are present. Resending clears the old input and uses sending feedback.
- Recovery defaults to **Recovery email**. Its helper explicitly distinguishes an **email recovery key** from the sign-in code. It does not suggest that either key can be invented or resent from this screen.
- Recovery email, saved words and backup file remain the three existing methods. A custom illustrated bottom sheet explains each and marks the current selection. Cancelling preserves input; choosing a different method clears private input.
- The backup chooser accepts JSON/plain text, reads security-scoped access and retains the existing 256 KiB bound. Cancelling the system chooser produces no error. Results are ignored once backgrounding or a method change invalidates the import.
- A fixed action tray stays above the keyboard, while fields and supplementary actions scroll independently. Focus scrolls the active field into view; scrolling artwork is clipped below the status area.
- Scan a code remains available before sign-in, during code entry and recovery. Pending claim intent uses the existing coordinator and returns after successful recovery.

The new copy has English, Spanish, French and Arabic entries in the canonical String Catalog. The actual presented method sheet explicitly inherits language, RTL, appearance and accessibility text size. Readable input and controls take precedence over illustration size; decorative art shrinks at accessibility sizes.

## Private input and lifecycle

`AccountRootView`, the production controller, account session, Keychain and generation guards retain their existing behavior. Background locks synchronously before replacing private content. The form clears code/recovery/file/password state on lock, sign-out and readiness. Submitting snapshots the selected method and inputs, clears the form, then awaits the existing recovery action. No secret is added to navigation state, preferences, screenshots or logs. Test screenshots use synthetic inputs and identities.

The existing painted account transitions still cover launch, reconnect, sending, verification, recovery and lock. They retain Reduce Motion/VoiceOver behavior and never delay actual readiness. See [account motion](ACCOUNT_MOTION.md).

## Account and security overview

Account's existing grouped profile/settings sheet and sign-out/forget controls remain. Recovery & security now has the drawn key, email/device context and illustrated web/legal rows. Sign-out preserves remembered device recovery; forgetting still requires the existing explicit destructive confirmation and removes that material.

Recovery setup/export and account deletion remain web capabilities, clearly disclosed beside **Manage recovery in LearnCard web**. This pass does not introduce fake native backup, deletion, biometric or security guarantees. The existing web destinations are unchanged.

## Verification boundaries

`AccountAccessUITests` adds code gating/resend/destination checks, method selection/cancellation/input clearing, background clearing of code and backup password, and actual Arabic accessibility/dark presentation. Existing lifecycle tests cover recovery failure/retry, background/resume, sign-out/relaunch and forgetting. Existing motion and pending-claim recovery tests exercise integration with the redesigned forms. Exact runs are in [TESTING](TESTING.md).

Automation uses disposable DEBUG fixtures on LearnCard Native UI Checks, with isolated Keychain accounts and a non-deliverable email. The real signed-in review simulator is separate. A new live email/recovery exchange, genuine backup-file recovery, physical-device keyboard/VoiceOver and human translation review remain manual checks. Passing synthetic UI checks does not establish those live results.

## Source landmarks

- `ios/Sources/AccountSignInView.swift`: state-driven access form, private inputs, keyboard/action layout and importer.
- `ios/Sources/AccountAccessUI.swift`: illustrated hero, recovery-method sheet and contextual notices.
- `ios/Sources/AccountView.swift`: account/security overview and existing account actions.
- `scripts/prepare-illustrations.ts`: original editable passport, email and recovery SVG artwork, light/dark variants.
- `localization/Localizable.xcstrings`: 42 new access keys, four languages.
- `ios/UITests/AccountAccessUITests.swift`: new behavioral and accessibility coverage.
