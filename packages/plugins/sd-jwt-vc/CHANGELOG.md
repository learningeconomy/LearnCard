# @learncard/sd-jwt-vc-plugin

## 0.2.4

### Patch Changes

-   [`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Republish package metadata with concrete internal dependency versions instead of workspace protocol ranges.

-   Updated dependencies [[`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68)]:
    -   @learncard/core@9.4.26
    -   @learncard/didkit-plugin@1.9.6
    -   @learncard/vc-plugin@1.5.6

## 0.2.3

### Patch Changes

-   [#1303](https://github.com/learningeconomy/LearnCard/pull/1303) [`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Switch workspace development to Bun source-mode resolution while preserving package build outputs for npm publishing.

-   Updated dependencies [[`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299)]:
    -   @learncard/core@9.4.25
    -   @learncard/didkit-plugin@1.9.5
    -   @learncard/vc-plugin@1.5.5

## 0.2.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@9.4.24
    -   @learncard/didkit-plugin@1.9.4
    -   @learncard/vc-plugin@1.5.4

## 0.2.1

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@9.4.23
    -   @learncard/didkit-plugin@1.9.3
    -   @learncard/vc-plugin@1.5.3

## 0.2.0

### Minor Changes

-   [#1258](https://github.com/learningeconomy/LearnCard/pull/1258) [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083) Thanks [@Custard7](https://github.com/Custard7)! - Slice 2a — wallet-ready categorization + display view-model.

    Adds two new pure helpers (also exposed as plugin methods on `learnCard.invoke.*`):

    -   `categorizeSdJwt(vct: string): string` — maps the credential's `vct` to a LearnCard wallet category. Default is `'Achievement'`; well-known EUDI PID vcts (`urn:eu.europa.ec.eudi:pid:1`, `urn:eudi:pid:1`) and a small path heuristic (`/pid/`, `/identity/`, etc.) map to `'ID'`. Runtime overrides via `registerSdJwtVctCategory(vct, category)`.
    -   `toSdJwtDisplayViewModel(parsed: ParsedSdJwtVc): SdJwtDisplayViewModel` — normalizes a parsed credential into the shape the wallet renders: derived category, issuer, ISO-formatted dates, and disclosed claims stripped of SD-JWT protocol metadata (`iss`, `iat`, `exp`, `vct`, `cnf`, `_sd_alg`, etc.). Disclosure keys are emitted as a defensive copy so consumers can mutate freely.

    Sets up Slice 2b (openid4vc plugin delegation) and Slice 2c (wallet-app VCDisplayCard adapter).

-   [#1258](https://github.com/learningeconomy/LearnCard/pull/1258) [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083) Thanks [@Custard7](https://github.com/Custard7)! - Slice 2b + 2c — SD-JWT-VC plumbed end-to-end into the LearnCard SDK with real verification at both receipt and display time.

    **`@learncard/sd-jwt-vc-plugin`** — adds a `verifyCredential` extension method following the same `VerifyExtension` pattern used by `@learncard/expiration-plugin`. When the credential's `proof.type` is `SdJwtCompactProof`, it routes through the SD-JWT-aware verifier (DID resolution + disclosure-hash check + issuer signature); everything else falls through to the chained vc-plugin / DIDKit verifier. The wallet's existing `learnCard.invoke.verifyCredential(vc)` call site (`VCDisplayCardWrapper2`) gets correct SD-JWT-VC verification with **zero changes to vc-plugin** and zero app-side branching. This closes the silent-pass hole where DIDKit returned `{ errors: [] }` for unknown proof types.

    **`@learncard/openid4vc-plugin`** — when an OID4VCI issuer returns a `dc+sd-jwt` or `vc+sd-jwt` credential, the wallet now:

    -   Delegates parse to the sd-jwt-vc plugin via `learnCard.invoke.parseSdJwtVc()` at runtime (no hard dep; throws a clear `unsupported_format` if the plugin isn't installed).
    -   Synthesizes a W3C-VC-shaped object (`type: ['VerifiableCredential', 'SdJwtVcCredential']`) so the wallet's existing store/index/read pipelines work without per-format branches. The original compact SD-JWT is preserved under `proof.jwt`; the `vct` is exposed under the `sdJwtVct` extension field.
    -   Routes category resolution through `learnCard.invoke.categorizeSdJwtVct(vct)` when the SD-JWT vc is detected; falls back to the existing W3C-`type[]` heuristic otherwise.

    **`@learncard/init`** — every seed-based initializer (`learnCardFromSeed`, `networkLearnCardFromSeed`, `didWebLearnCardFromSeed`, `didWebNetworkLearnCardFromSeed`) now auto-wires the sd-jwt-vc plugin alongside openid4vc. Existing apps pick up SD-JWT-VC support on upgrade with **no code changes**.

    Tested via mocked-plugin unit tests in `openid4vc/src/vci/store.test.ts` (delegation, fallback, missing-plugin failure, legacy `vc+sd-jwt` format). Manual smoke against walt.id documented in the sd-jwt-vc README.

-   [#1258](https://github.com/learningeconomy/LearnCard/pull/1258) [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083) Thanks [@Custard7](https://github.com/Custard7)! - SD-JWT-VC holder presentation (Slice 3) — selective disclosure, KB-JWT signing, and per-claim consent UI.

    ## What changed

    ### `@learncard/sd-jwt-vc-plugin`

    -   New `learnCard.invoke.presentSdJwtVc(compact, options)` method. Takes a stored compact SD-JWT-VC plus the verifier's audience+nonce and the user-chosen disclosure frame; returns the holder-bound compact `<JWT>~<disclosures>~<KB-JWT>?` presentation that the wallet POSTs as `vp_token`.
    -   New `createEd25519KbSigner({ privateJwk })` utility — builds a `@sd-jwt/types.Signer`-shaped KB-JWT signer from an Ed25519 OKP private JWK. Mirrors the existing `createJoseEd25519Signer` in `openid4vc/vci/proof.ts` but emits the KB-JWT signature segment (no compact envelope), as the underlying `@sd-jwt/sd-jwt-vc` library expects.
    -   KB-JWT (`typ: 'kb+jwt'`, `alg: 'EdDSA'`) is built only when the source credential has a `cnf` binding (RFC 9901 §4.3 / draft-ietf-oauth-sd-jwt-vc-16 §3.5). The library computes `sd_hash` over the compact form internally; we provide `aud`, `nonce`, `iat`.
    -   The plugin re-honors the source credential's `_sd_alg` (RFC 9901 §4.2.4) so KB-JWT hashes match what the issuer pinned.
    -   `presentSdJwtVc` is exported as a plugin method and from the package's public entry point.
    -   Unit tests cover: KB-JWT shape, selective-disclosure filtering, present-without-cnf, missing audience/nonce/kbSigner errors, signer factory negative cases, plugin surface integration.

    ### `@learncard/openid4vc-plugin`

    -   `BuiltDcqlPresentation` is now a discriminated union (`kind: 'vp' | 'sd-jwt-vc'`). VP entries carry the unsigned VP envelope as before; SD-JWT-VC entries carry the source compact + disclosure frame and skip the W3C VP envelope entirely (per OID4VP §6.1.1 — the SD-JWT compact IS the presentation, no JWT-VP wrapper).
    -   `VpFormat` widened to include `'dc+sd-jwt' | 'vc+sd-jwt'`. `signPresentation` routes SD-JWT entries through a new `helpers.sdJwtPresenter` callback instead of `jwtSigner` / `ldpVpSigner`. PEX submission descriptors for SD-JWT use `path: '$'`.
    -   `ChosenCredential.disclose?` and `DcqlChosenCredential.disclose?` accept an `SdJwtDiscloseFrame` (structurally compatible with `@sd-jwt/types.PresentationFrame`). The UI populates this; it flows through `buildPresentation`/`buildDcqlPresentations` → `signPresentation`/`signDcqlPresentations` → the SD-JWT presenter callback → `learnCard.invoke.presentSdJwtVc`.
    -   New `SdJwtDiscloseFrame` and `SdJwtPresenter` public types (exported from `vp/index.ts` and the package root).
    -   New `BuiltDcqlVpPresentation`, `BuiltDcqlSdJwtPresentation`, and `DcqlSignError` exports.
    -   `presentCredentials` (both DCQL and PEX routes) now wires `buildSdJwtPresenter(learnCard)` into the signing helpers when SD-JWT entries are present. This presenter constructs an Ed25519 KB-JWT signer inline using the host LearnCard's primary keypair (the same key used for VCI proof-of-possession and VP signing, matching the `cnf.jwk` issuers embed at claim time) and forwards to `learnCard.invoke.presentSdJwtVc` via runtime feature-detect — no hard import of the sd-jwt-vc plugin, preserving the Slice 2b convention.
    -   Mixed PEX submissions (one SD-JWT VC + one W3C VC in the same submission) are explicitly rejected with `unknown_credential_format`; multi-SD-JWT PEX submissions are rejected the same way. DCQL with mixed formats is fully supported (one VP per query id). These restrictions match how walt.id, Sphereon, and EUDI verifiers compose their requests in practice; multi-format PEX is tracked as a follow-up.
    -   `inferCredentialFormat` now detects SD-JWT-VC: compact strings matching `<jwt>~` shape and W3C-VC objects with `proof.type === 'SdJwtCompactProof'` resolve to `dc+sd-jwt`.
    -   New unit tests across `dcql/build.test.ts`, `dcql/respond.test.ts`, and `vp/sign.test.ts` cover the SD-JWT passthrough kind, missing presenter/source diagnostics, presenter error wrapping, and mixed DCQL VP+SD-JWT responses.

    ### `apps/learn-card-app` (no version bump — internal app)

    -   `Oid4vpExchange.tsx` and `RequestConsent.tsx` extended with per-claim consent UI for SD-JWT-VC credentials in the OID4VP flow.
    -   `ConsentPicks` is now `{ row: Record<string, number>; disclose: Record<string, SdJwtDiscloseFrame> }`. The consent screen detects SD-JWT-VCs in the user's picks, fetches their disclosable claims via `learnCard.invoke.parseSdJwtVc`, and renders a "Claims to share" section with one checkbox per disclosable claim (pre-checked, deselectable). Required claims (issuer, vct, expiration, etc.) are shown as read-only summary entries.
    -   Selections flow into `ChosenCredential.disclose` / `DcqlChosenCredential.disclose`, which the plugin pipes through to `presentSdJwtVc`.
    -   AGENTS.md UI/UX compliance: native `<input type="checkbox">` (no IonCheckbox), grayscale/emerald tokens only, Lucide icons + inline SVG dots (no emoji), `rounded-[20px]` button shape, emerald spinner pattern for in-flight parse states.

    ## Verified

    -   Tests: `sd-jwt-vc` 82/82, `openid4vc` 490/490, `learn-card-init` 52/52.
    -   LSP diagnostics clean on every changed file.
    -   All three packages build clean (`tsc -p tsconfig.json`).

    ## Acceptance criteria

    From the Week 3 row of `internal-docs/SD-JWT-Build-Plan.md`:

    -   [x] DCQL response shape matches OID4VP §6.4 (vp_token is a record keyed by `credential_query_id`, no `presentation_submission`).
    -   [x] Per-claim consent screen renders all disclosable claims and respects user deselections.
    -   [x] KB-JWT (typ=kb+jwt, alg=EdDSA) generated only when the source credential has `cnf`; required claims `aud`/`nonce`/`iat`/`sd_hash` all set.
    -   [x] Tampered disclosures and KB-JWT validation are gated by the existing Slice 1 verifier (Slice 4 hardens this with status-list checks).
    -   [x] Unit coverage ≥ 80% on new code paths.

    The walt.id live-verifier smoke test is a manual follow-up (documented in the sd-jwt-vc README); the unit test coverage exercises the same wire shape via the local SDJwtVcInstance test fixture.

-   [#1258](https://github.com/learningeconomy/LearnCard/pull/1258) [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083) Thanks [@Custard7](https://github.com/Custard7)! - Wire SD-JWT-VC verification through the wallet's existing `verifyCredential` chain — closes the silent-pass gap where DIDKit returned `{ errors: [] }` for any proof type it didn't recognize.

    The sd-jwt-vc plugin now implements `VerifyExtension` (same pattern as `expiration-plugin`), composing its own `verifyCredential` into the chain. When called:

    -   Credentials with `proof.type === 'SdJwtCompactProof'` (the marker `synthesizeSdJwtVc` sets on credentials received via OID4VCI) are routed to the SD-JWT-aware verifier — issuer DID resolution, signature check, disclosure hash integrity, assertion-method enforcement.
    -   All other credentials fall through to the previously-chained `verifyCredential` (vc-plugin / didkit) unchanged.

    Plugin install order matters: the sd-jwt-vc plugin must be added **after** vc-plugin and any other `VerifyExtension`-providing plugins (e.g., expiration-plugin). The `@learncard/init` seed-based initializers already do this.

    The OID4VCI receipt path (`synthesizeSdJwtVc` in openid4vc) now also verifies the issuer signature at receipt time — bad credentials land in `result.failures` instead of being silently stored. Display-time verification via `verifyCredential` is the canonical re-check; receipt-time verification is defense-in-depth.

    The companion `JwtProof2020` silent-pass behaviour for OID4VCI-received `jwt_vc_json` credentials is a pre-existing gap and is tracked as a separate follow-up.

### Patch Changes

-   Updated dependencies [[`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083)]:
    -   @learncard/core@9.4.22
    -   @learncard/didkit-plugin@1.9.2
    -   @learncard/vc-plugin@1.5.2

## 0.1.2

### Patch Changes

-   [#1256](https://github.com/learningeconomy/LearnCard/pull/1256) [`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Node ESM consumers (e.g. `@learncard/init`'s published ESM bundle) being unable to resolve named exports from these plugins.

    These packages previously declared only `main` (CJS shim) and `module` (ESM bundle) without an `exports` map. Node ESM does not honor the `module` field, so it fell back to the CJS shim — a conditional `module.exports = require(...)` re-export that `cjs-module-lexer` cannot statically analyze, causing `SyntaxError: Named export 'X' not found` for every downstream ESM consumer.

    Each affected plugin now:

    -   declares `"type": "module"`,
    -   ships its CJS shim as `dist/index.cjs` (renamed from `.js`) and bundle outputs as `.cjs`,
    -   exposes a proper `exports` map with `import` → ESM bundle, `require` → CJS shim, and `types` → `.d.ts`.

    No runtime behavior changes for existing consumers; bundlers that read `module` continue to work, and CJS `require()` callers continue to load the same shim under a new extension.

    This change is verified by two new CI surfaces:

    -   `bun run validate-packages` runs `publint` + `@arethetypeswrong/cli` against every published `@learncard/*` package's built `dist/`. Catches missing `exports` maps, dangling file paths, condition ordering bugs, ESM-file-as-CJS extension mistakes, and the `workspace:*` protocol-leakage incident class statically, before publish.
    -   `.github/workflows/smoketest-npm-packages.yml` now also probes every published plugin's ESM + CJS export surface directly (not just `@learncard/init` transitively) and bundles a trivial consumer with esbuild to catch bundler-resolution-only regressions.

    Follow-up work tracked as advisory failures in both surfaces (not gating CI until fixed): `@learncard/ceramic-plugin`, `@learncard/didkey-plugin`, `@learncard/helpers`, `@learncard/idx-plugin`, `@learncard/lca-api-plugin`, `@learncard/learn-cloud-plugin`, `@learncard/network-plugin`, `@learncard/simple-signing-plugin` each have pre-existing publish-time bugs (CJS-only transitive deps imported via named ESM, dynamic `require()` in ESM bundles, or unmigrated upstream packages).

-   Updated dependencies [[`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2)]:
    -   @learncard/didkit-plugin@1.9.1
    -   @learncard/core@9.4.21

## 0.1.1

### Patch Changes

-   Updated dependencies [[`7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b`](https://github.com/learningeconomy/LearnCard/commit/7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b)]:
    -   @learncard/didkit-plugin@1.9.0
    -   @learncard/core@9.4.20

## 0.1.0

### Minor Changes

-   [#1244](https://github.com/learningeconomy/LearnCard/pull/1244) [`1c0cc68548a23ec969f5f7ce6563fc18060beb71`](https://github.com/learningeconomy/LearnCard/commit/1c0cc68548a23ec969f5f7ce6563fc18060beb71) Thanks [@Custard7](https://github.com/Custard7)! - Initial release of `@learncard/sd-jwt-vc-plugin` — SD-JWT-VC holder + verifier read-path (RFC 9901 + draft-ietf-oauth-sd-jwt-vc-16). Holder can parse, reconstruct, and verify selectively-disclosed credentials from any DID-resolvable issuer (`did:key`, `did:web`, `did:jwk` plus the rest via the existing DIDKit bridge). Accepts both the canonical `dc+sd-jwt` (draft-16) and legacy `vc+sd-jwt` format strings. Browser-first; no Node-only dependencies.

    Out of scope this release (tracked as follow-ups): KB-JWT signing for presentations, per-claim consent UI, Token Status List, issuer-side signing, openid4vc transport wiring.

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@9.4.19
    -   @learncard/didkit-plugin@1.8.10
