# @learncard/openid4vc-plugin

OpenID for Verifiable Credentials **holder-side** support for LearnCard:

- **OID4VCI** — accept credential offers, exchange pre-authorized / authorization codes for access tokens, request credentials from issuers.
- **OID4VP** — parse Authorization Requests, match held credentials against Presentation Definitions (DIF PEX v2), build and sign VP tokens.
- **SIOPv2** — issue self-issued ID tokens for holder authentication.

## Status

**Slice 1 in progress.** This package is being built incrementally. Current surface:

| Capability | Status |
|---|---|
| Credential Offer URI parsing (by-value + by-reference) | ✅ Slice 1 |
| Draft 11 → Draft 13 normalization | ✅ Slice 1 |
| Issuer + authorization-server metadata fetching | ✅ Slice 2 |
| Pre-authorized code flow (`jwt_vc_json`) | ✅ Slice 2 |
| Proof-of-possession JWT (EdDSA, default signer from host LearnCard) | ✅ Slice 2 |
| Wallet index / LearnCloud integration (one-call `acceptAndStoreCredentialOffer`) | ✅ Slice 3 |
| JWT VC → W3C VC reconstruction (VCDM §6.3.1) with raw JWT preserved under `proof.jwt` | ✅ Slice 3 |
| Partial-failure reporting (one bad credential doesn't abort a batch) | ✅ Slice 3 |
| Authorization code flow + PKCE | ⏳ Slice 4 |
| `ldp_vc` credential format | ⏳ Slice 5 |
| OID4VP Authorization Request + PEX v2 | ⏳ Slice 6 |
| `direct_post` VP response | ⏳ Slice 7 |
| SIOPv2 ID token | ⏳ Slice 8 |

See the California RFP epic for full scope.

## Spec versions

- **OID4VCI**: [Draft 13](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html). Draft 11 offers are accepted and normalized on ingest.
- **OID4VP**: [Draft 22](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html).
- **SIOPv2**: [final](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html).
- **PEX**: DIF Presentation Exchange v2.

## Installation

```bash
pnpm add @learncard/openid4vc-plugin
```

Required peer plugins: `@learncard/vc-plugin`, `@learncard/didkit-plugin`.

## Usage

```ts
import { initLearnCard } from '@learncard/init';
import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

const baseLc = await initLearnCard({ seed: 'a'.repeat(64) });
const lc = await baseLc.addPlugin(getOpenID4VCPlugin(baseLc));

// Slice 1 — parse a credential offer URI without hitting the network:
const parsed = lc.invoke.parseCredentialOffer(
    'openid-credential-offer://?credential_offer=...'
);

if (parsed.kind === 'by_value') {
    console.log('Issuer:', parsed.offer.credential_issuer);
    console.log('Credentials on offer:', parsed.offer.credential_configuration_ids);
}

// Slice 2 — accept the offer end-to-end (fetch metadata, exchange the
// pre-authorized code for a token, build a proof-of-possession JWT, and
// request the credential):
const result = await lc.invoke.acceptCredentialOffer(
    'openid-credential-offer://?credential_offer=...',
    { txCode: '1234' } // only required when the offer carries a tx_code
);

for (const entry of result.credentials) {
    console.log(entry.format, entry.credential); // e.g. 'jwt_vc_json', 'eyJ.vc.jwt'
}
```

### Slice 3 — accept **and** store in one call

For the common case (accept an offer, persist the credentials, have them show up in the wallet UI), use `acceptAndStoreCredentialOffer`:

```ts
const result = await lc.invoke.acceptAndStoreCredentialOffer(offerUri, {
    txCode: '1234', // only if the offer requires it
    category: 'Achievement', // optional override; otherwise auto-derived from VC types
});

// All credentials issued by the offer:
result.credentials; // same as acceptCredentialOffer
// Credentials that were successfully persisted:
result.stored; // [{ uri, recordId, vc, configurationId, format }]
// Credentials that failed to normalize / upload / index:
result.failures; // [{ configurationId, format, error: VciError }]
```

What it does under the hood:

1. Runs the pre-authorized code flow exactly like `acceptCredentialOffer`.
2. Decodes each `jwt_vc_json` credential into a W3C VC per VCDM §6.3.1, preserving the raw JWT under `proof.jwt` so future verification can re-check the issuer signature.
3. Uploads each VC via `learnCard.store.LearnCloud.uploadEncrypted` (default — encrypted at rest for the holder) or `upload` when encryption isn't available.
4. Indexes each credential via `learnCard.index.LearnCloud.add(record)` so the wallet's credential list picks it up immediately.
5. Catches per-credential errors so one bad credential doesn't discard a whole batch.

Storage overrides:

```ts
await lc.invoke.acceptAndStoreCredentialOffer(offerUri, {
    encrypt: false, // use plain `upload` instead of `uploadEncrypted`
    category: vc => (vc.type?.includes('IdentityCredential') ? 'ID' : 'Achievement'),
    title: vc => vc.name as string,
    imgUrl: 'https://issuer.example.com/logo.png',

    // Low-level escape hatches for custom backends or tests:
    upload: async vc => myCustomStore.put(vc),
    addToIndex: async record => myCustomIndex.insert(record),
});
```

### Using your own signer

Callers using a non-Ed25519 key (HSM, secp256k1) should pass a custom signer:

```ts
import { ProofJwtSigner } from '@learncard/openid4vc-plugin';

const signer: ProofJwtSigner = {
    alg: 'ES256',
    kid: 'did:key:zDn...#zDn...',
    sign: async (header, payload) => myHsm.signCompactJws(header, payload),
};

await lc.invoke.acceptCredentialOffer(uri, { signer });
```

## Errors

All parse errors are thrown as `CredentialOfferParseError` with a stable `code` field so UI can map to friendly copy without string-matching messages:

| `code` | Meaning |
|---|---|
| `invalid_uri` | URI is malformed, non-https reference, or network fetch failed |
| `missing_offer` | Neither `credential_offer` nor `credential_offer_uri` present |
| `both_offer_and_uri` | Both parameters present (spec violation) |
| `invalid_json` | Offer payload or by-reference response was not valid JSON |
| `missing_issuer` | Offer has no `credential_issuer` |
| `missing_credentials` | Offer has no resolvable credential identifiers |
| `invalid_grants` | `grants` object is malformed |

## Testing

### Unit tests

```bash
pnpm --filter @learncard/openid4vc-plugin test
```

### Driving a real issuer end-to-end — `try-offer` harness

`scripts/try-offer.ts` drives `acceptCredentialOffer` against any Draft 13 conformant issuer with an ephemeral `did:jwk` keypair. It skips the full LearnCard wiring (no wallet, no LearnCloud plugin required), so it's the fastest way to validate the flow against live infrastructure during development.

```bash
# from repo root
pnpm --filter @learncard/openid4vc-plugin try-offer "<offer-uri>"

# or from the plugin dir
cd packages/plugins/openid4vc
pnpm try-offer "<offer-uri>"
```

Flags:

| Flag | Purpose |
|---|---|
| `--tx-code <code>` | PIN the issuer delivered out-of-band (if the offer carries `tx_code`) |
| `--client-id <id>` | Client identifier, if the authorization server requires one |
| `--only <id1,id2>` | Comma-separated subset of `credential_configuration_ids` to request |
| `--verbose`, `-v` | Log the full resolved offer and each credential's raw JWT |
| `--help`, `-h` | Show usage |

Output on success: the decoded W3C VC for each issued credential plus the issuer's `notification_id` (if supplied). On failure: the `VciError` code, HTTP status, error body, and cause — so you can distinguish `metadata_fetch_failed` from `token_request_failed` from `credential_request_failed` at a glance.

#### Recipes for public test issuers

All of these expose pre-authorized-code offers, so the harness works as-is.

**EUDI Reference Issuer** — most spec-conformant. Good first target.

1. Visit `https://dev.issuer.eudiw.dev/`.
2. Pick a credential (PID, mDL, etc.), start the issuance flow.
3. Instead of scanning the QR with a wallet app, copy the `openid-credential-offer://...` URI the page displays.
4. Run: `pnpm try-offer "openid-credential-offer://?credential_offer_uri=..."`
5. If prompted for a PIN, pass it via `--tx-code`.

**WaltID Portal** — friendliest UI.

1. Visit `https://portal.walt.id`, sign in (free), go to Issuer.
2. Issue a credential — the portal shows an offer URI / QR on the success page.
3. Copy the `openid-credential-offer://...` URI and feed it to the harness.

**Animo Funke** — Credo-TS based, EUDI-compatible.

1. Visit `https://funke.animo.id`, select a credential profile.
2. Start the issuance flow and copy the offer URI.
3. Run against the harness.

#### Running a local issuer

When you want deterministic iteration (same offer twice, offline, step-through debugging), run WaltID's issuer in Docker:

```bash
docker run --rm -p 7002:7002 -p 7003:7003 waltid/issuer-api:latest
# in another terminal, POST an offer config to http://localhost:7002/...
# then feed the returned offer URI to pnpm try-offer
```

#### What the harness does NOT cover

- **No wallet integration.** Credentials are decoded and printed, not persisted. Once Slice 10 wires `acceptAndStoreCredentialOffer` into the wallet UI, use the learn-card-app instead for that part of the flow.
- **No signature verification.** The harness trusts the issuer's response. Verifying the credential JWT against the issuer's published key is a separate concern handled by the VC plugin on read.
- **Pre-authorized code only.** Authorization-code flows arrive in Slice 4.

## License

MIT © [Learning Economy Foundation](https://www.learningeconomy.io)
