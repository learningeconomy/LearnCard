# @learncard/status-list-plugin

W3C [Bitstring Status List v1.0](https://www.w3.org/TR/vc-bitstring-status-list/) (and its `StatusList2021` legacy alias) revocation/suspension checking for LearnCard.

## What it does

A credential issuer can publish a Status List Credential — a single GZIP-compressed bitstring covering a population of credentials — and have each issued credential carry a `credentialStatus` entry pointing at one bit in that list. This plugin lets a wallet (or a verifier) look up a credential's bit and decide whether to honour it.

The implementation is fully cross-platform (browser + Node) and has no peer plugin dependencies — it can be added to any LearnCard, including a bare one created via `generateLearnCard()`.

## Status

| Capability | Status |
|---|---|
| `BitstringStatusListEntry` (W3C v1.0) | ✅ |
| `StatusList2021Entry` (legacy alias) | ✅ |
| Multibase `u`-prefix on `encodedList` | ✅ |
| High-order-bit-first bit indexing | ✅ |
| Both single-entry + array-of-entries shapes on `credentialStatus` | ✅ |
| Caller-supplied `fetchStatusList` (cached / proxy / test stub) | ✅ |
| Caller-supplied `fetchImpl` (DNS-pinning, mTLS, etc.) | ✅ |
| `RevocationList2020` (legacy didkit-handled type) | ❌ — return `unsupported_status_type` |
| Token Status List (IETF, CBOR + COSE) | ❌ — return `unsupported_status_type` |
| Multi-bit `statusSize > 1` (`message`-purpose) | ❌ — return `unsupported_status_type` |

## Installation

```bash
pnpm add @learncard/status-list-plugin
```

This plugin is **auto-attached** to every seed-based initializer in `@learncard/init` (`learnCardFromSeed`, `networkLearnCardFromSeed`, `didWebLearnCardFromSeed`, `didWebNetworkLearnCardFromSeed`). You do not need to call `getStatusListPlugin()` yourself unless composing a custom LearnCard from `@learncard/core`.

## Usage

### Through a LearnCard

```ts
import { initLearnCard } from '@learncard/init';

const lc = await initLearnCard({ seed: 'a'.repeat(64) });

const result = await lc.invoke.checkCredentialStatus(myCredential);

switch (result.outcome) {
    case 'active':
        // Bit 0 — honour the credential.
        break;
    case 'revoked':
        // Bit 1 with `revocation` purpose — refuse.
        break;
    case 'suspended':
        // Bit 1 with `suspension` purpose — refuse for now,
        // can be lifted by the issuer later.
        break;
    case 'no_status':
        // Credential has no `credentialStatus` field at all.
        // Wallet decides whether to require it.
        break;
    case 'unsupported_status_type':
        // We don't recognise this entry type. `result.detail`
        // explains what was seen.
        break;
}
```

### Standalone (no LearnCard)

```ts
import { checkCredentialStatus } from '@learncard/status-list-plugin';

const result = await checkCredentialStatus(myCredential, {
    fetchImpl: customFetch,                // optional
    fetchStatusList: async url => myCache.get(url) ?? defaultFetch(url), // optional
});
```

The pure function is what the plugin wraps internally; nothing else is required at call time.

## Errors

`StatusCheckError` is thrown for transport / encoding failures the caller should surface rather than treat as "active by default":

| `code` | Meaning |
|---|---|
| `invalid_status_entry` | The credential's `credentialStatus` is structurally malformed (missing `statusListCredential` URL, non-numeric `statusListIndex`, etc.) |
| `invalid_status_list` | The fetched Status List Credential has no `encodedList`, isn't valid base64url, or didn't GZIP-decompress |
| `list_fetch_failed` | The HTTP fetch (or `fetchStatusList` callback) failed or returned non-2xx |
| `index_out_of_range` | `statusListIndex` exceeds the bitstring length |
| `no_fetch` | Neither `fetchImpl` nor `fetchStatusList` was provided and `globalThis.fetch` isn't available (e.g., a Node version older than 18 with no polyfill) |

## Testing

```bash
pnpm --filter @learncard/status-list-plugin test
```

The exhaustive bitstring decode matrix (basic outcomes, both entry types, bit-layout invariants, fetch errors, malformed lists, encoding edge cases) lives in `src/status.test.ts`. The plugin-facade smoke tests live in `src/plugin.test.ts`. `src/test-helpers.ts` exposes `buildBitstringStatusListCredential({ bitsSet })` for callers (and the openid4vc plugin's tests) that need to construct fixture status lists without re-implementing the encode pipeline.

## License

MIT © [Learning Economy Foundation](https://www.learningeconomy.io)
