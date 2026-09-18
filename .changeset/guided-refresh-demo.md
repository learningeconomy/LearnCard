---
'@learncard/cli': minor
---

Add `learncard demo refresh`, a guided demonstration of sending a refreshable badge through `sendBoost`, publishing a new version from the returned receipt, and verifying the recipient's refreshed copy. Uses fresh demo accounts, defaults to the local network, and supports `--network staging`, `--yes`, and `--json`.

Add interactive `--ui` mode for the local LearnCard app: print a demo recipient sign-in link, deliver claim and update notifications, and wait for the app to save each version. Supports a custom local `--app-url` and validates that the app and CLI use matching local services.

Add `learncard demo refresh --inbox` for the deferred Universal Inbox path: issue a refreshable certificate to a random `@example.com` address with email delivery suppressed, publish a final version before any holder exists (`notification: "not-applicable"`), then claim with a real DIDAuth presentation and refresh to an honors version. `--inbox --ui` prints a claim link for the local app, waits for the human to claim, publishes an update to the bound holder, and verifies the app replaced (not duplicated) the same entry. Terminal mode supports `--yes`/`--json`, is local-only, and takes `--lca-url` (default `http://localhost:5100/trpc`) for the local signing service. The existing direct demo is unchanged.

Add opt-in `--inbox --ui --email [address]`: prompt for an address, send a provisional certificate through normal email delivery, let the recipient sign in and claim, then publish a visible final-results update. This mode never reads recipient keys or personal credential storage. Keep the pre-claim update in the separate disposable-account walkthrough.
