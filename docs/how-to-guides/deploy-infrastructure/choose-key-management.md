---
description: A decision guide — how should your integration manage LearnCard identities and keys?
---

# How Should I Manage Keys?

Every LearnCard identity is controlled by a private key derived from a seed. Who holds that seed — and how — is the most important security decision in your integration. Pick your scenario:

| Scenario                                                      | Approach                                                                      | Read                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Server-side issuer** (you issue credentials from a backend) | One seed in your secret manager; initialize a wallet per process              | [Remote Key Management](managing-seed-phrases.md)                                                                                  |
| **Server-to-server API calls only**                           | Skip wallet-per-request: create a scoped API token once                       | [Generate API Tokens](generate-api-tokens.md)                                                                                      |
| **Issuing via claim links / on users' behalf**                | Register a Signing Authority so keys never leave your control plane           | [Signing Authorities](../../core-concepts/identities-and-keys/signing-authorities.md)                                              |
| **End users in your own app** (passwordless, no seed UX)      | Shamir Secret Sharing — key split across device, server, and recovery methods | [Key Management (SSS)](../../core-concepts/identities-and-keys/key-management-sss.md) · [SSS Config](sss-key-management-config.md) |
| **Users switching devices**                                   | QR-based cross-device login                                                   | [Cross-Device Login](../../core-concepts/identities-and-keys/cross-device-login.md)                                                |
| **Lost access**                                               | Password, passkey, recovery phrase, or backup file                            | [Account Recovery](../../core-concepts/identities-and-keys/account-recovery.md)                                                    |

## Rules of thumb

- **Never put a seed in client-side code.** Browser and mobile apps should use SSS (users) or call your backend (issuance).
- **Prefer API tokens over wallets** for simple server integrations — a Bearer token with scope `boosts:write` sends credentials without key ceremony. See [Generate API Tokens](generate-api-tokens.md).
- **One seed = one identity.** Rotating a seed means a new DID; plan issuer identity before going to production.
- **Test recovery before launch.** An identity without a working recovery path is a support ticket factory.
