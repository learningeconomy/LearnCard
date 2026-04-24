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
| Pre-authorized code flow (`jwt_vc_json`) | 🚧 Slice 2 |
| Wallet index / LearnCloud integration | 🚧 Slice 3 |
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
} else {
    console.log('Fetch from:', parsed.uri);
}

// Or resolve a by-reference offer in one call:
const offer = await lc.invoke.resolveCredentialOffer(
    'openid-credential-offer://?credential_offer_uri=https://issuer.example.com/offers/abc'
);
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

```bash
pnpm --filter @learncard/openid4vc-plugin test
```

## License

MIT © [Learning Economy Foundation](https://www.learningeconomy.io)
