---
"@learncard/sss-key-manager": minor
"@learncard/email-templates": minor
"@learncard/types": patch
"learn-card-base": minor
"learn-card-app": minor
"@learncard/lca-api-service": minor
"@learncard/network-brain-service": patch
---

SSS prod hardening: confirmed recovery enrollment, lost-login identity rebind, and an isolated email relay.

- Recovery methods now carry `confirmedAt` and must be proven before they count (email confirmation code, phrase challenge words, backup re-decrypt, passkey round trip). New SSS accounts are `active` immediately; web3auth migrations stay `provisional` until a method is confirmed.
- New recovery-session flow lets a user whose sign-in identity is gone recover via a verified personal email and bind a new sign-in.
- Email recovery shares are encrypted on the client to an isolated relay's public key; `lca-api` never sees plaintext. Provider tokens move from query strings to the `X-Auth-Token` header.
- Sensitive key routes require a single-use DID challenge; key records are keyed by immutable provider ID.
- `recovery-key` email template now requires `confirmationCode`.
