---
description: A decision guide — how should your integration manage LearnCard identities and keys?
---

# How Should I Manage Keys?

Every LearnCard identity is controlled by a private key derived from a seed. Who holds that seed — and how — is the most important security decision in your integration. Pick your scenario:

| Scenario                                                      | Approach                                                                      | Read                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Server-side issuer** (you issue credentials from a backend) | One seed in your secret manager; initialize a wallet per process              | See "Storing the issuer seed" below                                                                                                      |
| **Server-to-server API calls only**                           | Skip wallet-per-request: create a scoped API token once                       | [Generate API Tokens](generate-api-tokens.md)                                                                                            |
| **Issuing via claim links / on users' behalf**                | Register a Signing Authority so keys never leave your control plane           | [Signing Authorities](../../core-concepts/identities-and-keys/signing-authorities.md)                                                    |
| **End users in your own app** (passwordless, no seed UX)      | Shamir Secret Sharing — key split across device, server, and recovery methods | [Key Management (SSS)](../../core-concepts/identities-and-keys/key-management-sss.md) · [SSS Key Manager](../../sdks/sss-key-manager.md) |
| **Users switching devices**                                   | QR-based cross-device login                                                   | [Cross-Device Login](../../core-concepts/identities-and-keys/cross-device-login.md)                                                      |
| **Lost access**                                               | Password, passkey, recovery phrase, or backup file                            | [Account Recovery](../../core-concepts/identities-and-keys/account-recovery.md)                                                          |
| **Testing your integration**                                  | Test on staging first with mock recipients                                    | [Test Safely](test-safely.md)                                                                                                            |

## Storing the issuer seed

If you are issuing credentials from a backend server, you must protect your issuer seed.

- **Use a secrets manager:** Read the seed from AWS Secrets Manager, HashiCorp Vault, or environment variables at boot.
- **Never commit it:** Never hardcode the seed in your source code or commit it to Git.
- **Plan your identity:** Rotating a seed results in a completely new DID. Plan your issuer identity carefully before moving to production.

For more details on how seeds work, see [Seed Phrases](../../core-concepts/identities-and-keys/seed-phrases.md).

## Rules of thumb

- **Never put a seed in client-side code.** Browser and mobile apps should use SSS (users) or call your backend (issuance).
- **Prefer API tokens over wallets** for simple server integrations — a Bearer token with scope `boosts:write` sends credentials without key ceremony. See [Generate API Tokens](generate-api-tokens.md).
- **One seed = one identity.** Rotating a seed means a new DID; plan issuer identity before going to production.
- **Test recovery before launch.** An identity without a working recovery path is a support ticket factory.
