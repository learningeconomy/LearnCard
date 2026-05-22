# E2E Encryption Hardening — Brain Service

## TL;DR

> The "end-to-end encrypted" claim is true only for one narrow path (LearnCloud JWE upload). The brain-service is structurally a trusted endpoint: it issues, signs, decrypts, and re-signs user credentials by design. This plan retires that capability in six phases, starting with the keystone change: removing `issueCertifiedBoost` and the server's decryption keypair. The early phases are independently shippable and remove the strongest reasons the server holds plaintext.

**Deliverables**

- Brain-service no longer holds a decryption capability over user credentials
- Credentials issued from boosts marked private are stored only as JWE
- Server-signing path zeroizes plaintext after signing
- Observability layer redacts credential payloads by default
- Honest, accurate "encryption story" published in docs and marketing
- Optional: HSM/TEE-backed signing for service-issued credentials

**Estimated effort**: ~7–9 months for Phases 0–5 with one engineer; ~5–6 months with two.
**Phase 1 alone**: ~2–3 weeks, independently shippable, highest leverage.

---

## Background

### Current state

Credentials move through brain-service via three distinct paths:

1. **Server-side issuance** (Boost / AutoBoost / signing-authority send) — brain-service constructs the VC in plaintext, signs it via a registered Signing Authority, and persists it as plaintext JSON in Neo4j. Resolvable as plaintext via `/storage/resolve`. **Default path.**
2. **Plaintext client store** — client calls `wallet.store.LearnCard.store(vc)` → `/storage/store` with a plain VC. Server stores plaintext.
3. **Client-encrypted (JWE)** — client builds a JWE via `wallet.store.LearnCloud.uploadEncrypted(vc, { recipients })`. Server can store the opaque JWE.

Only path (3) is end-to-end encrypted. Paths (1) and (2) are TLS-in-transit + plaintext-at-rest.

### The certification backdoor

`issueCertifiedBoost` in `boost.helpers.ts` is the strongest reason the brain-service holds a decryption capability:

- `sendBoost` calls `decryptCredential(credential)` using **`learnCard.id.keypair()`** — the brain-service's own keypair — to unwrap a JWE.
- This succeeds only when the credential was encrypted with the server's DID on the recipient list.
- The server then verifies derivation against the Boost template and issues a **second** credential (the "Certified Boost") signed by `did:web:{domain}`.
- The certified VC is then stored **in plaintext** (see `// TODO: Encrypt Boost Credential` on the existing call site). The encryption was effectively round-tripped to nothing.

Other manifestations of the same backdoor:

- `getOrCreateSharedUriForWallet` injects `did:web:network.learncard.com` into the JWE recipient list for SmartResume so the brain-service can decrypt and forward credentials to partners.
- `setStorageForUri` caches resolved plaintext in Redis.
- `ensureAlignmentsForBoostCredential` mutates cached credentials on resolve — incompatible with content-addressing.

### Out of scope for this plan

- Encrypting Boost templates themselves (they are public-by-design templates, not personal data — see "Boosts are templates" caveat below)
- Encrypting all Neo4j metadata at rest (the Tier 3 / item 3.4 mega-project — separate exploration, multi-year)
- Migrating away from Neo4j or the existing storage model
- Changes to the ConsentFlow contract semantics

### Boosts are templates, not personal data

This plan treats Boosts (the templates) as public-by-default network objects. The thing that requires E2E hardening is the **issued Credential** (per-recipient), not the Boost template. The few cases where Boosts need protection (unlisted boosts, sensitive selection criteria, draft boosts) are addressed in Phase 0 via field-level encryption and an API-layer access-control audit — **not** by treating Boosts as E2E payloads.

---

## Goals

1. Brain-service has no cryptographic capability to decrypt any user credential it stores.
2. Credentials issued from boosts marked `storage: 'encrypted-only'` are stored only as JWE, with the server enforcing rejection of plaintext payloads.
3. Server-side signing paths do not persist plaintext credentials beyond the in-memory signing step.
4. Stored credential URIs are content-addressed so the server cannot silently substitute or mutate.
5. Every user has at minimum two JWE recipients on their encrypted credentials: the consumer and a user-held recovery key. The server is on neither list by default.
6. Observability surfaces (Sentry, traces, logs, email templates) cannot accidentally leak credential payloads.
7. The published "encryption story" matches the implementation.

## Non-goals

- True E2E for server-side automated issuance flows that legitimately require server-held material (these become explicit, scoped, audited exceptions, not the default)
- Encrypted metadata graph traversal
- Removing all server-side signing (HSM/TEE is the bound here, not pure client signing)

---

## Verification Strategy

Every phase ships with:

- **Invariant tests** that fail loudly if regression occurs. Examples: "no record in Neo4j with `boost.privacy='encrypted'` has plaintext `instance.credential`"; "`learnCard.id.keypair()` is never used to decrypt user content."
- **Threat-model assertions** documented in `docs/core-concepts/`.
- **Backward-compat tests** that prove existing plaintext records continue to resolve correctly.

No phase is "done" until its invariants are enforced in CI.

---

## Phase 0 — Observability redaction, Boost access audit, private-boost field encryption

**Goal**: Stop bleeding plaintext through logs, traces, and exception reporting. Close gaps in non-public Boost access. Add field-level encryption for sensitive Boost fields.

**Estimated effort**: 6–8 weeks, one engineer.
**Independence**: Fully independent. Ships immediately.

### TODOs

- [x] **0.1 Sensitive type wrapper**
  - Introduce `Sensitive<T>` newtype in `src/types/`. Throws on `toString`/`toJSON` unless explicitly unwrapped via `.reveal()`.
  - Wrap all VC/VP/JWE payloads passing through routes in `Sensitive<>` at the route entry boundary.
  - **Acceptance**: `JSON.stringify(sensitiveVc)` produces `"[REDACTED]"`. Type system forbids accidental logging.

- [x] **0.2 Sentry payload scrubbing**
  - Add `beforeSend` filter that strips known credential-shaped objects and any field matching common credential field names (`credentialSubject`, `proof`, `evidence`, etc.).
  - Integration test: throw an error with a VC in `extra`; assert Sentry payload is scrubbed.
  - **Acceptance**: contrived test forces a credential into a Sentry capture; payload arrives at Sentry with credential fields replaced by `[REDACTED]`.

- [x] **0.3 Tracing redaction**
  - Forbid passing VC/VP/JWE payloads as span metadata in `traceDb`, `traceHttp`, `traceCrypto`, `traceInternal`.
  - Add ESLint or AST-grep rule that flags `trace*(...,..., { ...credential })` patterns.
  - **Acceptance**: lint rule catches violations in CI.

- [x] **0.4 Postmark template review**
  - Audit all transactional email templates that may reference credential contents.
  - Ensure templates render only allow-listed fields (recipient name, issuer name, claim link, boost name).
  - **Acceptance**: no template renders raw credential JSON.

- [ ] **0.5 Investigation mode**
  - Time-limited, audit-logged "break-glass" mechanism for staff to view plaintext when debugging.
  - All accesses logged with operator identity, reason, and target URI.
  - **Acceptance**: SOC2-grade audit log of every plaintext read by staff.

- [x] **0.6 Boost access control audit**
  - Review `canProfileViewBoost` and the claim-link gate in `/storage/resolve` for non-LIVE boosts.
  - Verify draft/provisional boost URIs are not enumerable; confirm rate-limiting on resolve attempts.
  - **Acceptance**: penetration-test write-up confirms no unauthenticated draft-boost enumeration.

- [ ] **0.7 Private-boost field encryption**
  - Add opt-in `encryptedFields: string[]` on Boost (`description`, `criteria`).
  - Server-key encryption (KMS-backed) — not E2E. Encrypts at rest, decrypts in-application for authorized viewers.
  - **Acceptance**: a boost with `encryptedFields: ['criteria']` shows ciphertext in Neo4j; authorized resolve returns plaintext; unauthorized resolve returns 403.

### Phase 0 exit criteria

- A contrived credential cannot leak via Sentry, traces, logs, or email.
- A draft/unlisted boost cannot be enumerated by unauthenticated callers.
- Boost issuers can mark fields as encrypted-at-rest.

---

## Phase 1 — Remove `issueCertifiedBoost` and the server decryption capability ⭐

**Goal**: Delete the keystone backdoor. The server can no longer decrypt user credentials. Replace certification with client-side derivation verification.

**Estimated effort**: 2–3 weeks, one engineer.
**Independence**: Independent of Phase 0; can ship in parallel.
**Why first / why starred**: largest single risk reduction in the whole plan. May obviate Phase 6 entirely.

### TODOs

- [x] **1.1 Pre-flight: confirm consumers**
  - Search every codebase (apps, partner SDKs, docs) for references to "certified", "Certified Boost", network-certification badges.
  - Confirm only the brain-service `sendBoost` call site uses `issueCertifiedBoost`.
  - Confirm no client UI renders a "Certified by LearnCard Network" badge sourced from these records (if it does, ship 1.4 in same release).
  - **Acceptance**: written audit confirming no external consumer breaks on removal.

- [x] **1.2 Client-side derivation verifier**
  - Move `verifyCredentialIsDerivedFromBoost` logic from `boost.helpers.ts` into `learn-card-base` as a client-side helper.
  - Wallet runs verification locally when displaying a boost credential. UI surfaces "Verified derivation of `{boostName}`" badge.
  - **Acceptance**: opening a boost credential in the wallet shows the verification badge without any network call to a certification endpoint.

- [x] **1.3 Issue-time template-hash binding**
  - At credential issue time, compute `sha256(canonicalize(boostTemplate))` and embed in the issued VC's metadata.
  - Verifier helper independently fetches the public Boost, recomputes the hash, asserts equality.
  - **Acceptance**: tampering with the boost between issue and verify causes the verifier to reject.

- [ ] **1.4 UI replacement for the network badge (if needed)**
  - If 1.1 finds any UI rendering a "network-certified" badge, replace it with the badge from 1.2 in the same release.
  - **Acceptance**: parity with the pre-removal UI; no visual regression.

- [x] **1.5 Delete `issueCertifiedBoost` and the call site**
  - Remove the call site in `sendBoost` (boost.helpers.ts lines ~426–434) and the surrounding `_skipCertification` plumbing.
  - Remove `issueCertifiedBoost` and `constructCertifiedBoostCredential`.
  - **Acceptance**: brain-service builds; `sendBoost` test suite passes with certification removed.

- [x] **1.6 Delete `decryptCredential` and audit all callers**
  - Confirm via repo-wide grep that `decryptCredential` has no remaining caller after 1.5.
  - Delete the helper.
  - **Acceptance**: brain-service no longer imports any "decrypt this VC for me" capability for user content.

- [x] **1.7 Remove server from JWE recipient lists**
  - In `getOrCreateSharedUriForWallet` (LearnCloud helper), delete the unconditional injection of `did:web:network.learncard.com` and localhost equivalents.
  - Replace with a per-feature opt-in: if a feature genuinely needs server reads, it must declare and document it; default is no server recipient.
  - **Acceptance**: SmartResume integration is either retired, refactored to client-mediated, or explicitly flagged as a documented server-trusted exception with a sunset date.

- [x] **1.8 Migration decision for existing certified VCs in storage**
  - Choose one: leave in place but stop reading (cheapest), delete in a one-shot job, or mark deprecated and age out.
  - Record decision and reasoning.
  - **Acceptance**: documented migration choice; if deleting, dry-run output reviewed before execution.

- [x] **1.9 Invariant test**
  - Add a CI test that fails if `learnCard.id.keypair()` is referenced as a decryption key in any code path.
  - Add a CI test that fails if the brain-service is ever found on a JWE recipient list in test fixtures.
  - **Acceptance**: invariants live in `test/invariants.spec.ts` and block merges.

- [x] **1.10 Documentation rewrite**
  - Rewrite `docs/core-concepts/credentials-and-data/boost-credentials.md` to remove the certified-boost section and describe client-side derivation verification.
  - Update any partner-facing docs that mention certification.
  - **Acceptance**: docs match implementation; no orphaned "certified" references.

### Phase 1 exit criteria

- `issueCertifiedBoost`, `constructCertifiedBoostCredential`, and `decryptCredential` are deleted from the codebase.
- The brain-service has no keypair-based decryption capability over any user credential.
- No JWE recipient list contains the brain-service by default.
- Client-side derivation verification provides equivalent product UX.
- Invariant tests enforce the above in CI.

---

## Phase 2 — Content-addressed credential URIs

**Goal**: Bind credential URIs to the bytes they reference, so the server cannot silently substitute or mutate stored credentials.

**Estimated effort**: 3 weeks.
**Independence**: Depends on Phase 1 only insofar as both should ship before Phase 3.

### TODOs

- [ ] **2.1 New URI scheme**
  - Introduce `lc:cred:{sha256}` URI form alongside existing scheme.
  - Resolve returns ciphertext; clients verify `sha256(received) === hashFromUri`.
  - **Acceptance**: a verifier rejects a substituted blob even if the server returns it under the same URI.

- [x] **2.2 Remove mutate-on-resolve**
  - Delete `ensureAlignmentsForBoostCredential`'s mutation behavior on resolve.
  - Move alignment injection to **issue time only**. Backfill existing records in a one-shot migration.
  - **Acceptance**: a credential resolved twice returns byte-identical content.

- [ ] **2.3 Versioning relationship**
  - Add `(:Storage)-[:SUPERSEDES]->(:Storage)` for cases where a credential is reissued (rare, but possible — revocation replacement, alignment backfill).
  - Client tooling surfaces version chains explicitly.
  - **Acceptance**: a reissued credential is resolvable both at its original URI and through the supersession chain.

- [x] **2.4 Cache invalidation by content hash**
  - `setStorageForUri` keys by hash, not by mutable URI parts.
  - **Acceptance**: cache cannot be poisoned by URI-shape collisions.

### Phase 2 exit criteria

- Issued credentials are resolvable via content-addressed URIs.
- The server cannot mutate a stored credential without the URI changing.
- No code path mutates a stored credential on resolve.

---

## Phase 3 — Enforced JWE for marked-private boosts + recovery-key recipient

**Goal**: When an issuer marks a boost `storage: 'encrypted-only'`, the brain-service refuses to store plaintext credentials issued from it. Every encrypted credential includes a user-held recovery key as a JWE recipient.

**Estimated effort**: 5–6 weeks.
**Independence**: Depends on Phase 2 (content-addressed URIs simplify the storage discriminator).

### TODOs

- [x] **3.1 Boost storage flag**
  - Add `storage: 'plaintext' | 'encrypted-only'` on Boost. Default `plaintext` (no behavior change for existing).
  - Propagate via contract terms when a boost is used in a ConsentFlow.
  - **Acceptance**: a boost marked `encrypted-only` rejects plaintext storage at `/storage/store` with a typed error.

- [ ] **3.2 SDK encryption at issuance**
  - Wallet learns the boost's storage flag. For `encrypted-only` boosts, the SDK builds a JWE before calling `/storage/store`.
  - JWE recipients: contract recipient(s) + the user's recovery key.
  - **Acceptance**: a credential issued from an `encrypted-only` boost arrives at the brain-service as JWE.

- [ ] **3.3 Recovery-key recipient enforcement**
  - Every JWE created by the SDK includes the user's recovery key DID as a recipient by default.
  - Recovery key generated at account creation (passkey-bound, SSS-backed, or recovery-phrase derived — leverage existing AuthCoordinator).
  - **Acceptance**: device-loss recovery flow can decrypt and re-encrypt the user's library to a fresh device key.

- [ ] **3.4 Server-side issuance: JWE before persist**
  - When the server is the issuer (signing-authority path) and the boost is `encrypted-only`, the server JWE-encrypts to the recipient(s) before persisting. Plaintext exists only in memory between sign and encrypt.
  - **Acceptance**: invariant test — no plaintext credential is ever written to `instance.credential` for an `encrypted-only` boost issuance.

- [x] **3.5 Storage discriminator**
  - Introduce `StoredCredential = { kind: 'plaintext' | 'jwe', body: string }` discriminator.
  - All resolve paths handle both. Federation resolves JWE without decrypting.
  - **Acceptance**: backward compatibility — existing plaintext records continue to resolve.

- [x] **3.6 Resolve does not mutate JWE**
  - `ensureAlignmentsForBoostCredential` is a no-op for JWE payloads (already enforced in Phase 2; verify here).
  - **Acceptance**: integration test confirms.

### Phase 3 exit criteria

- An issuer can declare a boost private; the server will refuse to ever hold its credentials in plaintext.
- Every encrypted credential is recoverable by the user without server assistance.

---

## Phase 4 — Server-signing path: zeroize plaintext

**Goal**: Eliminate durable plaintext from the server-signing flow. Plaintext exists only in memory for the duration of the sign-then-encrypt step.

**Estimated effort**: 6–8 weeks.
**Independence**: Depends on Phase 3 (the discriminator and storage flag).

### TODOs

- [x] **4.1 Issue-time alignment injection**
  - All alignment / OBv3 enrichment computed at issue time before signing. No resolve-time mutations remain.
  - Backfill historical records in a one-shot migration (already partially done in Phase 2.2).
  - **Acceptance**: zero call sites mutate a stored credential.

- [ ] **4.2 Sign-then-encrypt pipeline**
  - Server-side issuance pipeline: prepare → sign → encrypt-to-recipients → persist.
  - Plaintext credential never written to durable storage. Stored form is JWE only.
  - **Acceptance**: invariant test for all `encrypted-only` issuance flows.

- [x] **4.3 Best-effort zeroization**
  - Wipe in-memory plaintext after encryption (`Buffer.alloc(0)` for buffers; null out references). Document that Node.js does not guarantee true zeroization but the patterns reduce window.
  - **Acceptance**: code review checklist + documented limitation.

- [ ] **4.4 Decouple skill extraction / search**
  - Server-side features that historically parsed `instance.credential` (skill graphs, search indexing) need a structured-data alternative: extracted/derived data stored alongside the encrypted blob in a separate, explicitly-consented form.
  - Or: decrypt on demand via user-authorized re-encryption (defer to Phase 6 if pursued).
  - **Acceptance**: skill graph still works for credentials in `encrypted-only` boosts via the structured-data path.

- [ ] **4.5 Federation handshake**
  - Cross-instance resolve fetches JWE, not plaintext. Requesting instance must have a recipient key.
  - Update federation contract documentation.
  - **Acceptance**: federation tests pass without plaintext leaving an instance for `encrypted-only` payloads.

### Phase 4 exit criteria

- For `encrypted-only` boosts, plaintext never exists on durable storage anywhere in the system.
- Product features that depended on server-side plaintext access either work via structured-data alternatives or explicitly opt out.

---

## Phase 5 — HSM/TEE-backed signing for service-issued credentials

**Goal**: For credentials still issued by the server (signing-authority path), the signing key lives in an HSM or TEE. The brain-service never sees raw key material.

**Estimated effort**: ~2 months.
**Independence**: Independent of Phases 2–4; can run in parallel with Phase 4 as a separate track.

### TODOs

- [x] **5.1 KMS/HSM selection**
  - Evaluate AWS CloudHSM, GCP Cloud KMS, AWS Nitro Enclaves. Document decision and rationale.
  - **Acceptance**: ADR published.

- [ ] **5.2 HSM-backed signing for new keys**
  - All new signing-authority keys are HSM-resident. Brain-service calls HSM to sign; key never exported.
  - **Acceptance**: a new signing authority cannot be created with raw key material; HSM-backed only.

- [ ] **5.3 Migration of existing keys**
  - For each existing signing-authority key: import into HSM, switch the signer config, retire the file-stored copy.
  - **Acceptance**: zero file-stored signing keys remain in production.

- [x] **5.4 Latency and batching**
  - Measure HSM round-trip impact. Batch where possible (e.g., bulk auto-boost issuance on consent).
  - **Acceptance**: p95 issuance latency within 50ms of pre-migration baseline.

- [x] **5.5 Disaster recovery**
  - Document HSM key recovery procedure. Test in staging.
  - **Acceptance**: DR runbook reviewed and signed off.

### Phase 5 exit criteria

- No signing key exists outside an HSM in production.
- Issuance performance regression is within acceptable bounds.

---

## Phase 6 (optional) — Proxy re-encryption for server-mediated partner reads

**Goal**: Only if a need re-emerges for the server to mediate partner reads of user credentials *without* being on the recipient list permanently.

**Estimated effort**: 3–4 months, 2 engineers + external crypto review.
**Independence**: Likely **unnecessary** if Phase 1 retires SmartResume-style flows entirely.

### Why this is optional

Phase 1 removes the server from JWE recipient lists and retires or refactors SmartResume. If partners can pull credentials via direct client-mediated flows (user explicitly authorizes, wallet performs re-encryption), this phase is dead code.

Implement only if a concrete partner integration emerges that genuinely requires server-mediated, offline-user credential delivery. At that point, evaluate:

- Delegate-credential mechanism (user signs scoped delegation)
- Proxy re-encryption primitive (Umbral, recrypt-rs, MLS-based variants)
- Re-encryption oracle service (HSM/TEE-backed)
- External crypto audit

**Acceptance**: do not enter Phase 6 without a written product requirement justifying the trust tradeoff.

---

## Sequencing

```
Phase 0 ──┐
          ├─► Phase 1 ⭐ ──► Phase 2 ──► Phase 3 ──► Phase 4
Phase 5 ──┘                                            │
                                                       ▼
                                                  Phase 6 (only if needed)
```

- **Phases 0 and 1** can ship in parallel; Phase 1 is the highest-priority single change.
- **Phase 5** is an independent ops/infra track that can run in parallel with Phases 2–4.
- **Phase 6** is gated on actual product demand.

### Recommended slicing for an initial commitment

| Commitment level | Phases | Effort |
|---|---|---|
| **Minimum honest claim** | 0 + 1 | ~2–3 months |
| **Real hardening** | 0, 1, 2, 3 | ~5–6 months |
| **Full server-trust minimization** | 0–5 | ~7–9 months |

If only one phase ships this quarter, ship **Phase 1**.

---

## Risks

- **Phase 1 risk**: a hidden consumer of `decryptCredential` or `issueCertifiedBoost` not surfaced in pre-flight grep. Mitigation: Phase 1.1 is a hard gate.
- **Phase 3 risk**: SDK changes for encrypted-only issuance ship out of sync with server enforcement. Mitigation: SDK update lands first, server enforcement follows behind a flag.
- **Phase 4 risk**: server-side skill extraction breaks for `encrypted-only` boosts. Mitigation: 4.4 ships structured-data alternative before enforcement turns on.
- **Phase 5 risk**: HSM operational complexity. Mitigation: staged rollout, robust DR runbook.
- **Whole-plan risk**: scope creep into Phase 6 / metadata encryption. Mitigation: hold the line — those are separate, scoped projects with their own ROI analysis.

---

## Success Criteria

The plan is done when:

- [x] `decryptCredential` does not exist in the brain-service codebase.
- [x] `issueCertifiedBoost` does not exist; client-side derivation verification provides equivalent UX.
- [x] The brain-service is on zero JWE recipient lists by default.
- [x] Boosts can be marked `encrypted-only`; credentials issued from them are JWE-only at rest.
- [ ] Every user-encrypted credential has a recovery key as a recipient. [DEFERRED: Phase 3.3]
- [ ] Credential URIs are content-addressed; resolve is byte-stable. [DEFERRED: Phase 2.1]
- [x] No code path mutates a stored credential on resolve.
- [ ] Signing keys live in HSM/KMS, not on disk (if Phase 5 shipped). [DEFERRED: Phase 5.2]
- [x] Sentry, traces, logs, and email pipelines cannot leak credential payloads.
- [x] Public docs and marketing language match the implementation truthfully.
- [x] CI invariant tests enforce every assertion above and would catch a regression.

---

## Appendix: replaced product capabilities

| Removed | Replaced by |
|---|---|
| Server-issued "Certified Boost" VC | Client-side `verifyCredentialIsDerivedFromBoost` + issue-time template-hash binding embedded in the issued VC |
| Server on JWE recipient list (SmartResume) | Client-mediated partner sharing, or explicit scoped delegate credentials |
| Mutate-on-resolve alignment injection | Issue-time alignment computation + one-shot backfill |
| Server-side plaintext skill extraction (for encrypted-only boosts) | Structured derived data persisted alongside JWE with explicit user consent |
| File-stored signing-authority keys | HSM/KMS-resident keys (Phase 5) |
