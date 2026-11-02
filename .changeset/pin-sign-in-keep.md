---
'@learncard/sss-key-manager': patch
'@learncard/types': patch
'@learncard/email-templates': patch
'@learncard/lca-api-service': patch
'learn-card-base': patch
'learn-card-app': patch
---

Make the recovery PIN the main way to sign in on a new device, without resetting the account. A PIN sign-in now keeps the account's shares, history, recovery methods and escrow: the device stores the released recovery piece at the current version and re-sets the same PIN for a fresh attempt budget (a lost login is linked with the new `POST /keys/recovery-session/pin-sign-in`, accepted only after a PIN release). The server emails the account's verified addresses on every PIN sign-in ("New device signed in with your PIN. Not you? Secure your account."), and the PIN status reports earlier wrong entries. The app leads its recovery screen with PIN entry (no sign-out warnings on that path; the 7-day hold keeps them), asks once after signing in whether a device was lost or the PIN is known to someone else (warning about earlier wrong entries), and adds "Secure my account" / "Sign out of all other devices" (`POST /keys/revoke-other-devices`), reachable from that question, Account Recovery settings and the email link `/account/secure`. That action re-splits the key, purges older versions and unlinks every login except the current one; it does not change the key itself, so a device that is already signed in may keep working until it signs out (the app says so). A PIN-release token left unspent by a PIN sign-in can no longer wipe and rebind once the account has moved on. Needs security approval (Taylor) before production.
