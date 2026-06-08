---
'@learncard/sd-jwt-vc-plugin': minor
'@learncard/openid4vc-plugin': minor
---

SD-JWT-VC holder presentation (Slice 3) — selective disclosure, KB-JWT signing, and per-claim consent UI.

## What changed

### `@learncard/sd-jwt-vc-plugin`

- New `learnCard.invoke.presentSdJwtVc(compact, options)` method. Takes a stored compact SD-JWT-VC plus the verifier's audience+nonce and the user-chosen disclosure frame; returns the holder-bound compact `<JWT>~<disclosures>~<KB-JWT>?` presentation that the wallet POSTs as `vp_token`.
- New `createEd25519KbSigner({ privateJwk })` utility — builds a `@sd-jwt/types.Signer`-shaped KB-JWT signer from an Ed25519 OKP private JWK. Mirrors the existing `createJoseEd25519Signer` in `openid4vc/vci/proof.ts` but emits the KB-JWT signature segment (no compact envelope), as the underlying `@sd-jwt/sd-jwt-vc` library expects.
- KB-JWT (`typ: 'kb+jwt'`, `alg: 'EdDSA'`) is built only when the source credential has a `cnf` binding (RFC 9901 §4.3 / draft-ietf-oauth-sd-jwt-vc-16 §3.5). The library computes `sd_hash` over the compact form internally; we provide `aud`, `nonce`, `iat`.
- The plugin re-honors the source credential's `_sd_alg` (RFC 9901 §4.2.4) so KB-JWT hashes match what the issuer pinned.
- `presentSdJwtVc` is exported as a plugin method and from the package's public entry point.
- Unit tests cover: KB-JWT shape, selective-disclosure filtering, present-without-cnf, missing audience/nonce/kbSigner errors, signer factory negative cases, plugin surface integration.

### `@learncard/openid4vc-plugin`

- `BuiltDcqlPresentation` is now a discriminated union (`kind: 'vp' | 'sd-jwt-vc'`). VP entries carry the unsigned VP envelope as before; SD-JWT-VC entries carry the source compact + disclosure frame and skip the W3C VP envelope entirely (per OID4VP §6.1.1 — the SD-JWT compact IS the presentation, no JWT-VP wrapper).
- `VpFormat` widened to include `'dc+sd-jwt' | 'vc+sd-jwt'`. `signPresentation` routes SD-JWT entries through a new `helpers.sdJwtPresenter` callback instead of `jwtSigner` / `ldpVpSigner`. PEX submission descriptors for SD-JWT use `path: '$'`.
- `ChosenCredential.disclose?` and `DcqlChosenCredential.disclose?` accept an `SdJwtDiscloseFrame` (structurally compatible with `@sd-jwt/types.PresentationFrame`). The UI populates this; it flows through `buildPresentation`/`buildDcqlPresentations` → `signPresentation`/`signDcqlPresentations` → the SD-JWT presenter callback → `learnCard.invoke.presentSdJwtVc`.
- New `SdJwtDiscloseFrame` and `SdJwtPresenter` public types (exported from `vp/index.ts` and the package root).
- New `BuiltDcqlVpPresentation`, `BuiltDcqlSdJwtPresentation`, and `DcqlSignError` exports.
- `presentCredentials` (both DCQL and PEX routes) now wires `buildSdJwtPresenter(learnCard)` into the signing helpers when SD-JWT entries are present. This presenter constructs an Ed25519 KB-JWT signer inline using the host LearnCard's primary keypair (the same key used for VCI proof-of-possession and VP signing, matching the `cnf.jwk` issuers embed at claim time) and forwards to `learnCard.invoke.presentSdJwtVc` via runtime feature-detect — no hard import of the sd-jwt-vc plugin, preserving the Slice 2b convention.
- Mixed PEX submissions (one SD-JWT VC + one W3C VC in the same submission) are explicitly rejected with `unknown_credential_format`; multi-SD-JWT PEX submissions are rejected the same way. DCQL with mixed formats is fully supported (one VP per query id). These restrictions match how walt.id, Sphereon, and EUDI verifiers compose their requests in practice; multi-format PEX is tracked as a follow-up.
- `inferCredentialFormat` now detects SD-JWT-VC: compact strings matching `<jwt>~` shape and W3C-VC objects with `proof.type === 'SdJwtCompactProof'` resolve to `dc+sd-jwt`.
- New unit tests across `dcql/build.test.ts`, `dcql/respond.test.ts`, and `vp/sign.test.ts` cover the SD-JWT passthrough kind, missing presenter/source diagnostics, presenter error wrapping, and mixed DCQL VP+SD-JWT responses.

### `apps/learn-card-app` (no version bump — internal app)

- `Oid4vpExchange.tsx` and `RequestConsent.tsx` extended with per-claim consent UI for SD-JWT-VC credentials in the OID4VP flow.
- `ConsentPicks` is now `{ row: Record<string, number>; disclose: Record<string, SdJwtDiscloseFrame> }`. The consent screen detects SD-JWT-VCs in the user's picks, fetches their disclosable claims via `learnCard.invoke.parseSdJwtVc`, and renders a "Claims to share" section with one checkbox per disclosable claim (pre-checked, deselectable). Required claims (issuer, vct, expiration, etc.) are shown as read-only summary entries.
- Selections flow into `ChosenCredential.disclose` / `DcqlChosenCredential.disclose`, which the plugin pipes through to `presentSdJwtVc`.
- AGENTS.md UI/UX compliance: native `<input type="checkbox">` (no IonCheckbox), grayscale/emerald tokens only, Lucide icons + inline SVG dots (no emoji), `rounded-[20px]` button shape, emerald spinner pattern for in-flight parse states.

## Verified

- Tests: `sd-jwt-vc` 82/82, `openid4vc` 490/490, `learn-card-init` 52/52.
- LSP diagnostics clean on every changed file.
- All three packages build clean (`tsc -p tsconfig.json`).

## Acceptance criteria

From the Week 3 row of `internal-docs/SD-JWT-Build-Plan.md`:

- [x] DCQL response shape matches OID4VP §6.4 (vp_token is a record keyed by `credential_query_id`, no `presentation_submission`).
- [x] Per-claim consent screen renders all disclosable claims and respects user deselections.
- [x] KB-JWT (typ=kb+jwt, alg=EdDSA) generated only when the source credential has `cnf`; required claims `aud`/`nonce`/`iat`/`sd_hash` all set.
- [x] Tampered disclosures and KB-JWT validation are gated by the existing Slice 1 verifier (Slice 4 hardens this with status-list checks).
- [x] Unit coverage ≥ 80% on new code paths.

The walt.id live-verifier smoke test is a manual follow-up (documented in the sd-jwt-vc README); the unit test coverage exercises the same wire shape via the local SDJwtVcInstance test fixture.
