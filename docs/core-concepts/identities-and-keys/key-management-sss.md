---
description: How LearnCard protects private keys using Shamir Secret Sharing
---

# Key Management (SSS)

## Keys without seed phrases

LearnCard app users don't need to hold or manage a private-key seed.

Shamir Secret Sharing (SSS) splits their key into four shares — device, server,
recovery, and email backup — with a **2-of-4 threshold**.

At rest, no single party holds the whole key in this split-key model.

At sign-in, two shares are combined in memory on the user's device to reconstruct
the key for signing.

## Why an integrator cares

Users of your app inside LearnCard have a real DID for receiving credentials and
signing presentations, without a seed-management user experience.

## Choose your approach

- [SSS Key Manager reference](../../sdks/sss-key-manager.md) — the library, share storage, and recovery APIs.
- [Seed Phrases](seed-phrases.md) — the developer-held-seed alternative for SDK integrations.
