# @learncard/sd-jwt-vc-plugin

SD-JWT-VC holder + verifier support for LearnCard. Implements:

- [RFC 9901](https://www.rfc-editor.org/rfc/rfc9901.html) — Selective Disclosure for JWTs (SD-JWT)
- [draft-ietf-oauth-sd-jwt-vc-16](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/16/) — SD-JWT-VC profile for Verifiable Credentials
- Token Status List (cached + network paths) for revocation/suspension checks

## Status

**Holder read-path: feature-complete.** The plugin parses, reconstructs, and verifies SD-JWT-VCs against any DID-resolvable issuer (`did:key`, `did:web`, `did:jwk`). Presentation (KB-JWT signing) lands in Slice 3; status list lands in Slice 4.

| Capability | Status |
|---|---|
| Parse compact serialization (Issuer JWT + Disclosures + optional KB-JWT) | ✅ Slice 1 |
| Reconstruct fully-disclosed claims | ✅ Slice 1 |
| Verify issuer signature (via DID resolution) + disclosure hashes | ✅ Slice 1 |
| `dc+sd-jwt` and legacy `vc+sd-jwt` format strings | ✅ Slice 1 |
| Per-claim selective disclosure preview | ✅ Slice 1 |
| Wallet display view-model (`vct` → category) | ⏳ Slice 2 |
| Holder presentation + KB-JWT signing | ⏳ Slice 3 |
| Token Status List checking (cached + network) | ⏳ Slice 4 |

## Spec versions

- **SD-JWT**: RFC 9901 (Proposed Standard, Nov 2025)
- **SD-JWT-VC**: draft-ietf-oauth-sd-jwt-vc-16 (May 2026). Format string `dc+sd-jwt` is canonical; legacy `vc+sd-jwt` is accepted on read for back-compat.

## Architectural notes

- **Format-plugin, not transport.** The plugin is self-contained — it knows nothing about OID4VCI, OID4VP, or VC-API. The `openid4vc` plugin delegates to this plugin via `learnCard.invoke.parseSdJwtVc()`, `verifySdJwtVc()`, etc.
- **Library**: `@sd-jwt/core` + `@sd-jwt/sd-jwt-vc` (OpenWallet Foundation, Apache-2.0). Callback-based crypto so our existing `jose` Ed25519 signer plugs in.
- **DID resolution**: delegated to `@learncard/didkit-plugin` (`resolveDid()`). Supports `did:key`, `did:web`, `did:jwk`, `did:ethr`, `did:pkh:*`, `did:tz`.
- **Browser-first**: no Node-only dependencies. Uses Web Crypto SHA-256, `crypto.getRandomValues`, and `jose`.

## Installation

```bash
pnpm add @learncard/sd-jwt-vc-plugin
```

Required peer plugin: `@learncard/didkit-plugin` (for issuer DID resolution).

## Usage

```ts
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });

// Parse only — no network, no verification
const parsed = await learnCard.invoke.parseSdJwtVc(compact);
console.log(parsed.vct);          // 'https://credentials.example.com/...'
console.log(parsed.claims);       // fully-reconstructed payload

// Verify (parses + verifies issuer signature + checks disclosure hashes)
const check = await learnCard.invoke.verifySdJwtVc(compact);
if (check.errors.length > 0) {
    console.error('Verification failed:', check.errors);
}
```

## Errors

All errors thrown by this plugin are `SdJwtVcError` instances with a stable `code` field for UI mapping. See [`src/types.ts`](./src/types.ts) for the full code list.

## Testing

```bash
pnpm --filter @learncard/sd-jwt-vc-plugin test
```

The plugin's unit suite uses OpenWallet Foundation SD-JWT-VC test vectors (RFC 9901 Appendix A) as conformance fixtures.

## License

MIT © [Learning Economy Foundation](https://www.learningeconomy.io)
