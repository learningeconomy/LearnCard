---
description: The 64-character hex seed behind a server-side LearnCard identity — how to generate it, what it controls, and how to keep it.
---

# Seed Phrases

When your server runs `initLearnCard({ seed })`, the seed is the whole identity. Every key, and therefore the DID and every signature, is derived from it deterministically. Same seed, same identity — on any machine, forever.

## What a seed is

A **64-character hexadecimal string**: 32 bytes of randomness. Not a list of words.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Or in a browser: `Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')`.

Two things to know about how it's read:

- A non-hex string throws.
- A hex string shorter than 64 characters is left-padded with zeros, so `'1'` and `'000…001'` are the same seed. Don't rely on this — always pass the full 64 characters.

## What it controls

Whoever has the seed **is** the identity. They can sign credentials as you, read your encrypted storage, and change your profile. There's no password reset: if the seed leaks, revoke what you can and create a new identity; if you lose it, the identity is gone.

Rotating a seed means a new DID. Recipients' credentials still verify (the old DID still resolves), but new credentials come from a new issuer. Pick your production seed before you issue anything you care about.

## Keeping it

- **Read it from a secrets manager or environment variable at startup.** Never in source code, never in git, never in a client-side bundle.
- **One seed per identity, one identity per purpose.** Your production issuer and your staging issuer should be different seeds; the same seed produces the same `did:key` on every network.
- **Back it up like a root credential.** If the only copy is in one server's env file, one bad deploy loses the identity.

## Seeds vs. seed phrases

Cryptocurrency wallets use 12–24 word **mnemonic phrases** (BIP-39) as a human-friendly encoding of the same kind of randomness. LearnCard's `seed` parameter takes the hex directly. You could encode a seed as a phrase for offline backup and decode it before passing it in, but the SDK doesn't do that for you.

## When you don't need one

End users of the LearnCard app never see a seed. Their key is generated for them and split into shares — see [Key Management (SSS)](key-management-sss.md). A seed is for **your server, bot, or CLI**: something that runs unattended and needs a stable identity. If you'd rather not hold one at all, use an API token and let LearnCard sign for you — see [Who Signs Your Credentials?](../../how-to-guides/create-signing-authority.md).
