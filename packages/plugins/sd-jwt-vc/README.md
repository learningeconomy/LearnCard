# @learncard/sd-jwt-vc-plugin

SD-JWT-VC holder + verifier support for LearnCard. Implements:

- [RFC 9901](https://www.rfc-editor.org/rfc/rfc9901.html) — Selective Disclosure for JWTs (SD-JWT)
- [draft-ietf-oauth-sd-jwt-vc-16](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/16/) — SD-JWT-VC profile for Verifiable Credentials

Revocation and suspension checks support signed JWT Token Status Lists using the credential issuer’s signing key. See the supported profile below.

## Status

**Holder read-path + wallet display: feature-complete.** The plugin parses, verifies, categorizes, and produces a wallet-ready display view-model for SD-JWT-VCs against any DID-resolvable issuer (`did:key`, `did:web`, `did:jwk`). Holder presentations include KB-JWT signing; status checks use the bounded JWT profile below.

| Capability                                                                                                                                         | Status         |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Parse compact serialization (Issuer JWT + Disclosures + optional KB-JWT)                                                                           | ✅ Slice 1     |
| Reconstruct fully-disclosed claims                                                                                                                 | ✅ Slice 1     |
| Verify issuer signature (via DID resolution + assertionMethod check)                                                                               | ✅ Slice 1     |
| `dc+sd-jwt` and legacy `vc+sd-jwt` format strings (auto-detected from JOSE `typ`)                                                                  | ✅ Slice 1     |
| JOSE `typ` validation (draft-16 §3.2.1.1)                                                                                                          | ✅ Slice 1     |
| `vct` → wallet category mapping (`categorizeSdJwt`)                                                                                                | ✅ Slice 2a    |
| Wallet display view-model (`toSdJwtDisplayViewModel`)                                                                                              | ✅ Slice 2a    |
| openid4vc integration (OID4VCI receipt + wallet store delegation)                                                                                  | ✅ Slice 2b    |
| Auto-wiring into `@learncard/init` seed-based initializers                                                                                         | ✅ Slice 2c    |
| `learnCard.invoke.verifyCredential` extension — routes SD-JWT credentials through the SD-JWT verifier, leaves W3C credentials on the existing path | ✅ Slice 2d    |
| Holder presentation + KB-JWT signing                                                                                                               | ✅ Slice 3     |
| Token Status List checking (network; bounded freshness)                                                                                            | ✅ JWT profile |

## Spec versions

- **SD-JWT**: RFC 9901 (Proposed Standard, Nov 2025)
- **SD-JWT-VC**: draft-ietf-oauth-sd-jwt-vc-16 (May 2026). Format string `dc+sd-jwt` is canonical; legacy `vc+sd-jwt` is accepted on read for back-compat.

## Architectural notes

- **Format-plugin, not transport.** The plugin is self-contained — it knows nothing about OID4VCI, OID4VP, or VC-API. The `openid4vc` plugin delegates to this plugin via `learnCard.invoke.parseSdJwtVc()`, `verifySdJwtVc()`, etc.
- **Extends `verifyCredential`** the same way `expiration-plugin` does — implements `VerifyExtension` so calls to `learnCard.invoke.verifyCredential(vc)` route SD-JWT credentials (proof.type `'SdJwtCompactProof'`) through the SD-JWT-aware verifier, and leave all other credentials on the previously-chained verify path. `vc-plugin` has no SD-JWT knowledge; the routing lives entirely here. Plugin-install order matters: install this plugin **after** `vc-plugin` and any other `VerifyExtension`-providing plugins (e.g., `expiration-plugin`).
- **Library**: `@sd-jwt/core` + `@sd-jwt/sd-jwt-vc` (OpenWallet Foundation, Apache-2.0). Callback-based crypto so our existing `jose` Ed25519 signer plugs in.
- **DID resolution**: delegated to `@learncard/didkit-plugin` (`resolveDid()`). Supports `did:key`, `did:web`, `did:jwk`, `did:ethr`, `did:pkh:*`, `did:tz`.
- **Browser-first**: no Node-only dependencies. Uses Web Crypto SHA-256, `crypto.getRandomValues`, and `jose`.
- **Portable Ed25519 verification**: older WebViews can verify without Ed25519 WebCrypto support. Explicit issuer JWK `key_ops` must allow public-key verification only, preserving the browser import restriction.

## Verification model

SD-JWT-VC credentials are verified at **two points**:

1. **At receipt time** — the `openid4vc` plugin calls `learnCard.invoke.verifySdJwtVc(compact)` before synthesizing the W3C-VC-shaped object. If the issuer signature or disclosure hashes fail, the credential lands in `result.failures` and never enters the wallet store.
2. **At display / re-verify time** — the wallet's existing `learnCard.invoke.verifyCredential(vc)` call routes through this plugin's `verifyCredential` extension. SD-JWT credentials are re-verified via the SD-JWT path; everything else falls through to the chained verifier. This catches credentials whose issuer's DID rotated since claim, expired credentials, etc.

## Installation

The plugin is **auto-wired into every seed-based `@learncard/init` initializer** (`learnCardFromSeed`, `networkLearnCardFromSeed`, `didWebLearnCardFromSeed`, `didWebNetworkLearnCardFromSeed`). Hosts pick it up on upgrade without code changes.

For custom LearnCards that don't use `@learncard/init`:

```bash
bun add @learncard/sd-jwt-vc-plugin
```

Required peer plugin: `@learncard/didkit-plugin` (for issuer DID resolution).

## Manual smoke test (walt.id sandbox)

End-to-end verification that a real SD-JWT-VC issued by walt.id flows through OID4VCI → openid4vc → sd-jwt-vc → LearnCloud index:

1. Visit `https://portal.walt.id` → Issuer → pick the SD-JWT-VC profile → "Create Offer".
2. Copy the resulting `openid-credential-offer://…` URI.
3. In a Node REPL with a seed-based LearnCard:
    ```js
    const lc = await initLearnCard({ seed: 'a'.repeat(64) });
    const result = await lc.invoke.acceptAndStoreCredentialOffer('openid-credential-offer://...');
    console.log(result.stored[0].format); // → "dc+sd-jwt"
    console.log(result.stored[0].vc.type); // → ["VerifiableCredential", "SdJwtVcCredential"]
    console.log(result.stored[0].vc.sdJwtVct); // → walt.id's vct
    ```
4. Confirm the credential appears in `lc.index.LearnCloud.get({ category: 'Achievement' })` (or `'ID'` for PID-shaped vcts).

## Usage

```ts
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });

// Parse only — no network, no verification
const parsed = await learnCard.invoke.parseSdJwtVc(compact);
console.log(parsed.vct); // 'https://credentials.example.com/...'
console.log(parsed.claims); // fully-reconstructed payload

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
bun --filter @learncard/sd-jwt-vc-plugin run test
```

The unit suite round-trips real credentials end-to-end: each test generates a fresh Ed25519 keypair, issues an SD-JWT-VC via `SDJwtVcInstance` from the OpenWallet Foundation library, then exercises the plugin's `parse` / `verify` paths against the live output. Hand-crafted fixtures cover the negative-shape cases (missing `iss`, `vct`, `alg`).

Cross-implementation conformance against RFC 9901 Appendix A vectors and OpenWallet's published test suite lands as part of Slice 4 (see status table above).

## License

MIT © [Learning Economy Foundation](https://www.learningeconomy.io)

## Credential status

`verifySdJwtVc` checks `status.status_list` after credential validation using the
[Token Status List draft-21](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-status-list-21)
JWT format. Status tokens must use the same signing key and algorithm as the
verified credential, `typ: statuslist+jwt`, and the exact referenced URI as `sub`.
Delegated status issuers, CWT lists and other status mechanisms are unsupported.

A fresh HTTPS request omits cookies and referrer and rejects redirects. The
initial transport profile accepts public DNS names, not IP literals or local
hostnames. It bounds the request to five seconds, the token to 256 KiB and the
decompressed list to 2 MiB. Expiration, issued-at freshness (five minutes maximum),
optional `nbf`/`ttl`, bit widths and index bounds are checked. No status-token cache
is shared between verifications. Server hosts handling untrusted issuers should
apply their outbound-network policy as well; hostname syntax does not validate
DNS resolution.

Results include `statusList: { value, checkedAt, validUntil }` only after
successful authentication and decoding; timestamps use milliseconds. The deadline
is capped at 60 seconds and shortened by the signed expiration, TTL and local
freshness policy. Status 0 is valid; 1 produces `status_revoked`, 2 produces
`status_suspended`, and other values produce `status_unsupported`. Transport,
authentication, malformed-list and stale-list failures produce `status_check_failed`.
These results do not report a bad credential signature.

`skipStatusCheck: true` is an explicit opt-out: it adds a warning and produces no
status proof. Android account eligibility does not accept that result. Credentials
without a status reference retain their existing verification path. W3C Bitstring
Status Lists are a different format and remain on the existing W3C credential path.
