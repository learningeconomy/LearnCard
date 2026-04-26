# @learncard/openid4vc-plugin

OpenID for Verifiable Credentials **holder-side** support for LearnCard:

- **OID4VCI** — accept credential offers, exchange pre-authorized / authorization codes for access tokens, request credentials from issuers.
- **OID4VP** — parse Authorization Requests, match held credentials against Presentation Definitions (DIF PEX v2), build and sign VP tokens.
- **SIOPv2** — issue self-issued ID tokens for holder authentication.

## Status

**Holder surface feature-complete.** Every slice that touches the wire — offer intake, both VCI flows, OID4VP with PEX *and* DCQL, JARM-encrypted responses, SIOPv2 — is implemented and verified live against walt.id, Sphereon, and Animo Paradym. The remaining work is wallet-app UI integration (Slice 10) and CI infrastructure (Slice 11).

### OID4VCI — issuance side

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
| Authorization code flow + PKCE (`beginCredentialOfferAuthCode` / `completeCredentialOfferAuthCode`) | ✅ Slice 4 |
| `ldp_vc` issuance format | ⏳ Slice 5 — `jwt_vc_json` covers every issuer we test against; revisit when a partner needs LD-proof issuance. |

### OID4VP — presentation side

| Capability | Status |
|---|---|
| OID4VP Authorization Request URI parsing (inline + `presentation_definition_uri`) | ✅ Slice 6 |
| DIF PEX v2 matcher (JSONPath subset + JSON Schema filter subset) | ✅ Slice 6 |
| Candidate selection + `submission_requirements` (`all` / `pick` / `from_nested`) | ✅ Slice 6 |
| Presentation Submission `descriptor_map` builder | ✅ Slice 6 |
| Format designation matching (`jwt_vc_json` / `ldp_vc` / `ldp`) | ✅ Slice 6 |
| VP construction (`buildPresentation`): unsigned VP + PresentationSubmission | ✅ Slice 7a |
| VP signing (`signPresentation`): `jwt_vp_json` (JWS) + `ldp_vp` (LD proof via host) | ✅ Slice 7b |
| `direct_post` VP response (`submitPresentation`) | ✅ Slice 7c |
| End-to-end `presentCredentials()` verified against **walt.id**, **Sphereon**, **Animo Paradym** | ✅ Slice 7 |
| Signed Request Objects (`request` / `request_uri` JWS) — `client_id_scheme=did` (did:jwk, did:web) + `x509_san_dns` (trusted-roots or self-signed-dev) | ✅ Slice 7.5 |
| **DCQL query** — W3C OID4VP Draft 22 alternative to PEX. Same `prepareVerifiablePresentation` / `presentCredentials` entry points; DCQL takes precedence when both `dcql_query` and `presentation_definition` are present. | ✅ |
| **JARM** — encrypted `direct_post.jwt` responses (JWE A128CBC-HS256 / ECDH-ES). Selected automatically when the verifier requests `response_mode=direct_post.jwt`. | ✅ |

### SIOPv2 + cross-cutting

| Capability | Status |
|---|---|
| SIOPv2 ID token (`signIdToken`) standalone + auto-bundled when `response_type` includes `id_token` | ✅ Slice 8 |
| Browser-safe runtime (no `node:crypto` / `node:zlib`) — bundles cleanly into `apps/learn-card-app` | ✅ Slice 7.6 |
| Auto-wired into every seed-based `@learncard/init` function | ✅ Slice 7.6 |
| Bitstring Status List checking | Extracted into [`@learncard/status-list-plugin`](../status-list/README.md). Auto-wired into the same seed-based init functions; call `lc.invoke.checkCredentialStatus(...)` to use it. |
| Deep-link / QR entry points in `learn-card-app` | ⏳ Slice 9 |
| UI adapter for consent + selection in `learn-card-app` / `learn-card-base` | ⏳ Slice 10 |
| Self-hosted issuer + verifier in CI | ⏳ Slice 11 |

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

### Related plugins

The wallet's bitstring revocation/suspension checking lives in [`@learncard/status-list-plugin`](../status-list/README.md), which is auto-wired into the same seed-based init functions. Use `lc.invoke.checkCredentialStatus(credential)` after init to consult the W3C Bitstring Status List for any held credential.

### Bundled by default with `@learncard/init`

Every seed-based initializer in `@learncard/init` (`learnCardFromSeed`, `networkLearnCardFromSeed`, `didWebLearnCardFromSeed`, `didWebNetworkLearnCardFromSeed`) automatically attaches this plugin to the resulting LearnCard. **You do not need to call `getOpenID4VCPlugin()` yourself** unless you're composing a custom LearnCard from `@learncard/core`. Pass plugin config through the init function's `openid4vc` option:

```ts
import { initLearnCard } from '@learncard/init';

const lc = await initLearnCard({
    seed: 'a'.repeat(64),
    openid4vc: {
        // Optional. Defaults are sensible for most callers.
        // fetchImpl: customFetch,
        // trustedX509Roots: [pemString],
    },
});

// All OpenID4VC methods are now available on `lc.invoke.*`.
```

### Browser compatibility

As of `lc-1794` the plugin's runtime surface is fully cross-platform. The previously node-only dependencies (`node:crypto.X509Certificate`, `node:crypto.randomBytes`, `node:zlib.gunzipSync`) have been swapped for Web Crypto, `crypto.getRandomValues`, `@peculiar/x509`, and `fflate`. The plugin can be bundled directly into a browser app without polyfills; the holder methods all run end-to-end in `apps/learn-card-app`.

## Usage

```ts
import { initLearnCard } from '@learncard/init';

const lc = await initLearnCard({ seed: 'a'.repeat(64) });

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

### Slice 4 — authorization code flow with PKCE

When an offer's `grants` carries `authorization_code` (with or without an `issuer_state`), the issuer wants the wallet to bounce the user through their authorization endpoint before issuing. The plugin splits this into two awaits with the user-redirect step in between:

```ts
// 1. Offer in hand. Build the authorize URL + persist a flow handle
//    (PKCE verifier, nonce, etc.). Open `authorizationUrl` in a popup
//    or top-level redirect.
const { authorizationUrl, flowHandle } = await lc.invoke.beginCredentialOfferAuthCode(
    offerUri,
    {
        redirectUri: 'https://wallet.example.com/callback',
        clientId: 'wallet.example.com',
        scope: ['openid'],            // optional
        // userHint: 'alice@example.com', // optional `login_hint`
    }
);

localStorage.setItem('vci.flow', JSON.stringify(flowHandle));
window.location.href = authorizationUrl;

// 2. After the issuer redirects back to `redirect_uri` with `?code=...&state=...`,
//    finish the exchange. Same return shape as `acceptCredentialOffer`.
const flowHandle = JSON.parse(localStorage.getItem('vci.flow')!);
const { code, state } = parseQuery(window.location.search);

const result = await lc.invoke.completeCredentialOfferAuthCode({
    flowHandle,
    code,
    state,
});

for (const entry of result.credentials) {
    console.log(entry.format, entry.credential);
}
```

`flowHandle` is a small JSON-safe object — you can persist it in `localStorage`, a cookie, or your wallet's session store. It carries the PKCE `code_verifier`, the offer, and the issuer/AS metadata snapshot so step 2 doesn't need to re-fetch.

### Slice 8 — SIOPv2 ID tokens

Some verifiers want a self-issued ID token instead of (or alongside) a VP. `presentCredentials` does the right thing automatically when `response_type` includes `id_token`, but you can also drive it standalone:

```ts
const { idToken } = await lc.invoke.signIdToken(authorizationRequestUri, {
    // All optional — sensible defaults from the host LearnCard.
    // holder: 'did:jwk:eyJ...',
    // signer: customSigner,
    // additionalClaims: { name: 'Alice', email: 'alice@example.com' },
});
```

The ID token is a JWS over a SIOPv2 payload (`iss = sub = holder DID`, `aud = client_id`, `nonce` from the request). When the verifier asks for `vp_token id_token`, `presentCredentials` signs both, bundles the ID token into the `direct_post`, and returns it on the result for inspection.

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

## OID4VP — presenting credentials to a verifier

When a verifier scans/links you an `openid4vp://` URI, the wallet needs to: (1) resolve the verifier's request (including verifying any signed Request Object), (2) figure out which held credentials satisfy the DIF PEX Presentation Definition, (3) let the user choose, (4) sign + POST a VP token. All four steps are wired up end-to-end via `plugin.presentCredentials()` (Slices 6 + 7 + 7.5).

### Slice 6a — parse an Authorization Request without touching the network

```ts
const parsed = lc.invoke.parseAuthorizationRequest(
    'openid4vp://?client_id=https%3A%2F%2Fverifier.example.com&...'
);

if (parsed.kind === 'by_value') {
    console.log('Verifier:', parsed.request.client_id);
    console.log('Nonce:',    parsed.request.nonce);
    console.log('Return to:', parsed.request.response_uri);
}
```

Three discriminated variants:

- **`by_value`** — every param was inline; the returned `request` is ready for matching.
- **`by_reference_request_uri`** — the verifier delegated the request to a signed JWS fetched from `request_uri`. Slice 7.5 verifies the signature per `client_id_scheme` (see below) and inlines the claims.
- **`by_reference_request_jwt`** — same thing but the JWS is embedded directly via the `request` param.

### Slice 6b — resolve `presentation_definition_uri` over HTTP

```ts
// One call: parse + fetch out-of-band PD + return a fully-resolved request.
const request = await lc.invoke.resolveAuthorizationRequest(uri);
console.log(request.presentation_definition?.input_descriptors);
```

### Slice 6c — match held credentials against the PD (the main method)

`prepareVerifiablePresentation` is the turnkey entry point: resolve the verifier's request, walk every `input_descriptor`, and return a preview object the UI can render directly.

```ts
import type { CandidateCredential } from '@learncard/openid4vc-plugin';

// Your wallet's credentials, in whatever shape they live in today.
const candidates: CandidateCredential[] = myRecords.map(r => ({
    credential: r.vc,              // JSON-LD object, or a JWT-VC string
    format: r.format,              // optional; inferred from shape when absent
    id: r.uri,                     // optional caller-side id for audit/UI
}));

const { request, selection } = await lc.invoke.prepareVerifiablePresentation(
    uri,
    candidates
);

if (!selection.canSatisfy) {
    // UI shows a "We couldn't satisfy this request" state.
    // `selection.reason` is a user-readable summary; per-descriptor
    // reasons live at `selection.descriptors[i].reason`.
    showError(selection.reason);
    return;
}

for (const descriptor of selection.descriptors) {
    console.log(`Descriptor ${descriptor.descriptorId}: ${descriptor.candidates.length} match(es)`);
    for (const match of descriptor.candidates) {
        console.log('  ', match.candidate.id, '→', match.candidate.format);
    }
}
```

### Slice 6d — build a Presentation Submission

Once the user picks one credential per descriptor, build the DIF PEX v2 `presentation_submission` that will ride alongside the vp_token:

```ts
import { buildPresentationSubmission } from '@learncard/openid4vc-plugin';

const submission = buildPresentationSubmission(request.presentation_definition!, [
    {
        descriptorId: 'university-degree',
        format: 'ldp_vc',
        path: '$.verifiableCredential[0]',
    },
    {
        descriptorId: 'drivers-license',
        format: 'jwt_vc_json',
        path: '$.verifiableCredential[1]',
        pathNested: '$', // JWT VC is the whole value at that path
    },
]);

// submission.id, submission.definition_id, submission.descriptor_map[]
```

### PEX subset supported

The matcher is spec-correct for the vast majority of Presentation Definitions seen in the wild. It covers:

- **JSONPath (`field.path[]`)** — root (`$`), dotted (`$.a.b.c`), bracketed (`$['foo bar']`), numeric index (`$.a[0]`), wildcard (`$.a[*]`, `$.a.*`), recursive descent (`$..foo`). Filter predicates (`[?(@.x=='y')]`) and array slicing (`[0:2]`) throw a descriptive error rather than silently missing.
- **JSON Schema filter (`field.filter`)** — `type`, `const`, `enum`, `pattern`, `minimum` / `maximum` / `exclusiveMinimum` / `exclusiveMaximum`, `minLength` / `maxLength`, `contains`, `items`, `minItems` / `maxItems`. Unknown keywords pass by default (lenient mode) so verifiers introducing new keywords don't block wallet upgrades.
- **`submission_requirements`** — `rule: 'all'`, `rule: 'pick'` with `count` / `min` / (soft) `max`, and nested `from_nested` groups.
- **Format designations** — `descriptor.format` takes precedence over `pd.format`; candidates are filtered before JSONPath runs. `jwt_vc_json` credentials are transparently base64url-decoded for matching (paths like `$.credentialSubject.id` work even when the raw credential is a compact JWS).

If your verifier lands a PEX feature we haven't modeled, open an issue with the Presentation Definition — the matcher layer is designed to swap for a full `ajv`-backed implementation without touching the plugin surface.

### DCQL — OID4VP Draft 22 query language

DCQL (Digital Credentials Query Language) is OID4VP Draft 22's spec-native alternative to DIF PEX. When a verifier sends `dcql_query` instead of `presentation_definition`, the same entry points work — `prepareVerifiablePresentation` returns DCQL match results in `selection.descriptors`, and `presentCredentials` builds a DCQL `vp_token` (a record keyed by `credential_query_id`) instead of a PEX submission. DCQL takes precedence when a verifier sends both.

```ts
// Same call as before — no caller-side change needed for DCQL.
const { request, selection } = await lc.invoke.prepareVerifiablePresentation(
    uri,
    candidates
);

if (request.dcql_query) {
    // selection.descriptors[i].descriptorId === credential_query.id
    // selection.descriptors[i].candidates  === DCQL match candidates
}
```

### JARM — encrypted response mode

When a verifier requests `response_mode=direct_post.jwt`, the wallet must encrypt the response body to the verifier's JWKS (advertised via `client_metadata.jwks` or `client_metadata.jwks_uri`). The plugin handles this automatically: `submitPresentation` (and therefore `presentCredentials`) inspects the resolved request, discovers the verifier's encryption key, and emits a JWE (`alg=ECDH-ES`, `enc=A128CBC-HS256` by default) wrapping the standard direct_post payload. No caller-side change required — if a verifier asks for JARM, you get JARM.

## Errors

VCI errors are thrown as `CredentialOfferParseError` / `VciError`; VP errors as `VpError`. Every error carries a stable `code` field so UI can map to friendly copy without string-matching messages.

### `CredentialOfferParseError.code`

| `code` | Meaning |
|---|---|
| `invalid_uri` | URI is malformed, non-https reference, or network fetch failed |
| `missing_offer` | Neither `credential_offer` nor `credential_offer_uri` present |
| `both_offer_and_uri` | Both parameters present (spec violation) |
| `invalid_json` | Offer payload or by-reference response was not valid JSON |
| `missing_issuer` | Offer has no `credential_issuer` |
| `missing_credentials` | Offer has no resolvable credential identifiers |
| `invalid_grants` | `grants` object is malformed |

### `VpError.code`

| `code` | Meaning |
|---|---|
| `invalid_uri` | Authorization Request URI is malformed or has no query string |
| `invalid_json` | `presentation_definition` / `client_metadata` / resolved PD was not valid JSON |
| `missing_client_id` | Authorization Request has no `client_id` |
| `missing_nonce` | Authorization Request has no `nonce` (replay-protection required by spec) |
| `missing_response_type` | Authorization Request has no `response_type` |
| `unsupported_response_type` | `response_type` is neither `vp_token` nor `id_token` |
| `missing_response_target` | Neither `response_uri` (Draft 22+) nor legacy `redirect_uri` is present |
| `missing_presentation_definition` | `vp_token` request carries no `presentation_definition`, `presentation_definition_uri`, or `scope` |
| `invalid_presentation_definition` | PD is structurally malformed (missing `id`, empty `input_descriptors`, descriptor without `constraints`) |
| `both_definition_and_uri` | Both `presentation_definition` and `presentation_definition_uri` supplied (spec violation) |
| `presentation_definition_fetch_failed` | Fetching `presentation_definition_uri` timed out, returned non-2xx, or disallowed by scheme |

Signed Request Objects surface a separate typed error, `RequestObjectError`, with these codes:

| `code` | Meaning |
|---|---|
| `invalid_request_object` | JWS couldn't be decoded, or the payload was missing required claims (`client_id` in particular) |
| `request_fetch_failed` | Fetching `request_uri` failed or returned non-2xx |
| `missing_client_id_scheme` | Neither URL params nor JWS claims supplied `client_id_scheme` |
| `unsupported_client_id_scheme` | Scheme is one we don't yet implement (`pre-registered`, `verifier_attestation`), or a forbidden scheme (`redirect_uri`) was combined with a signed JWS |
| `client_id_mismatch` | Outer URL `client_id` disagrees with signed `client_id`, OR (for x509) the leaf cert SAN doesn't cover the `client_id` host |
| `request_signature_invalid` | JWS signature failed to verify against the resolved key |
| `request_signer_untrusted` | DID resolver couldn't find the `kid`; or the x509 chain didn't root into `trustedX509Roots` |
| `did_resolution_failed` | DID resolver couldn't produce a document (network error for `did:web`, unsupported method for others) |

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
| `--save <path>` | Write the issued credential(s) as JSON at `<path>` — single VC as an object, multiple as an array. Feed it straight into `try-verify --credentials <path>`. `*.vc.json`, `my-vc*.json`, and `issued-credentials*.json` are gitignored by default so real holder credentials never get committed. |
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
- **Pre-authorized code only.** The harness drives the pre-authorized flow because it's headless. The plugin itself supports the authorization code flow via `beginCredentialOfferAuthCode` / `completeCredentialOfferAuthCode` (Slice 4); exercising it requires a real browser to bounce through the issuer's authorization endpoint, so it's covered by the wallet app's e2e tests rather than this harness.

### Driving a real verifier end-to-end — `try-verify` harness

`scripts/try-verify.ts` is the OID4VP counterpart to `try-offer`: it takes a verifier's Authorization Request URI, resolves the Presentation Definition, runs the PEX matcher + selector against credentials you supply, and prints the exact `presentation_submission` the wallet would POST back. Slice 6's entire surface gets exercised in one command.

```bash
pnpm --filter @learncard/openid4vc-plugin try-verify \
    "<oid4vp-uri>" \
    --credentials ./my-vc.json
```

Flags:

| Flag | Purpose |
|---|---|
| `--credentials <path>` | JSON file containing a W3C VC object, a compact JWT-VC string, or an array of either |
| `--holder <path>` | Sidecar written by `try-offer --save` — carries the holder `did` / `kid` / private JWK. Default: `<credentials>.holder.json` |
| `--submit` | After PEX selection, sign the VP and POST it via `direct_post` |
| `--envelope <fmt>` | Force `jwt_vp_json` or `ldp_vp` (default: inferred from PD + VC formats) |
| `--trusted-root <path>` | PEM file with a trusted X.509 root — required for `client_id_scheme=x509_san_dns` verifiers. Repeatable. |
| `--unsafe-allow-self-signed` | Dev-only: accept self-signed x509 chains. Disables the chain-to-trust-root check. **Never production.** |
| `--verbose`, `-v` | Log the full resolved request + per-field JSONPath matches |
| `--help`, `-h` | Show usage |

The harness drives the full Slice 7 pipeline when `--submit` is set: build → sign → POST. Without it, it stops after previewing the `presentation_submission` so you can inspect what would be sent.

#### Recipe: walt.id Verifier Portal (UI flow)

The quickest path to a real OID4VP URI.

1. Visit `https://portal.walt.id`, sign in (free), open **Verifier**.
2. Pick a credential template (e.g. `OpenBadgeCredential`, `VerifiableDiploma`) and click **Create Verification**.
3. The portal shows a QR and a clickable `openid4vp://...` URL. Copy the URL.
4. Run:

   ```bash
   pnpm try-verify "openid4vp://?..." --credentials ./my-vc.json --submit
   ```

   walt.id's default verifier flow uses `client_id_scheme=redirect_uri` with inline PD — no trust-anchor setup required. If you pick a flow that wraps the request in a signed JWS, the harness automatically verifies it via the configured DID resolver (did:jwk / did:web out of the box).
5. If `canSatisfy: ✓ YES`, the harness signs a JWT-VP, POSTs to the verifier's `response_uri`, and prints the `redirect_uri` the walt.id portal hands back. If `✗ NO`, each descriptor's `reason` field explains why (wrong format, missing type, filter mismatch).

#### Recipe: walt.id Verifier REST API (scripted flow)

When you want to iterate quickly on a specific Presentation Definition without the portal UI.

```bash
# 1. POST a PD to walt.id's hosted verifier to get a session URI.
curl -s -X POST https://verifier.demo.walt.id/openid4vc/verify \
     -H "Content-Type: application/json" \
     -H "authorizeBaseUrl: openid4vp://authorize" \
     -H "responseMode: direct_post" \
     --data '{
       "request_credentials": [
         { "input_descriptor": {
             "id": "UniversityDegree",
             "format": { "jwt_vc_json": { "alg": ["EdDSA","ES256"] } },
             "constraints": {
               "fields": [ { "path": ["$.type"],
                             "filter": { "type": "array",
                                         "contains": { "const": "UniversityDegreeCredential" } } } ]
             }
           } }
       ]
     }'
# → returns a plain openid4vp://... URI in the response body.

# 2. Run the harness against it.
pnpm try-verify "openid4vp://..." --credentials ./my-vc.json --submit
```

This path is perfect for regression-testing after we change the PEX matcher — you can keep a single PD template and rerun it after every selector change.

#### Recipe: Sphereon demo verifier

Sphereon's reference verifier (`https://ssi.sphereon.com`) emits both by-value URIs and signed Request Objects (`client_id_scheme=did` with `did:web`). Both work without any extra flags — Slice 7.5 resolves the did:web document over the harness's fetch and verifies the JWS before matching.

1. Visit the Sphereon demo verifier, pick a flow (e.g. "Request University Degree").
2. Copy the `openid4vp://` URI.
3. `pnpm try-verify "openid4vp://..." --credentials ./my-vc.json`.

#### Recipe: Animo Paradym

Animo's Paradym verifier playground (`https://paradym.id`) supports both `ldp_vc` and `jwt_vc_json` requests and is the second real-world verifier we smoke-tested against. Flow is identical to walt.id's.

#### Where to get a credential to feed it

The fastest loop is `try-offer --save` → `try-verify --credentials`:

```bash
# 1. Issue a credential from walt.id / Animo / EUDI and write it to disk.
pnpm try-offer "<offer-uri>" --save ./my-vc.json

# 2. Point a real verifier at the same file.
pnpm try-verify "<oid4vp-uri>" --credentials ./my-vc.json --submit
```

`try-offer` writes the credential in its normalized W3C VC shape (JWT-VCs keep their compact JWS under `proof.jwt`), which `try-verify`'s `inferCredentialFormat` classifies correctly in both directions — so a single `./my-vc.json` round-trips through matchers for either format.

The plugin's `.gitignore` excludes `my-vc.json`, `my-vc*.json`, `*.vc.json`, and `issued-credentials*.json` by default so a real credential dropped into this directory never gets committed. Use any of those names for your local testing file.

#### What the harness does NOT cover

- **No `client_id_scheme=pre-registered` / `verifier_attestation`.** Both surface `unsupported_client_id_scheme` from the Slice 7.5 verifier. `did` (did:jwk + did:web built-in, others via custom `didResolver`) and `x509_san_dns` (with `trustedX509Roots`) are the supported schemes.

  JARM (encrypted `direct_post.jwt`) and DCQL queries are both supported in the plugin and exercised through the wallet's e2e suite, not via this harness.

## License

MIT © [Learning Economy Foundation](https://www.learningeconomy.io)
