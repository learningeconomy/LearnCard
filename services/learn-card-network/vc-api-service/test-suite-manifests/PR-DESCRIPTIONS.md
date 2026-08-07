# Manifest PR descriptions (paste-ready)

Submit **only after** prod is deployed and verified:
`curl https://vc-api.network.learncard.com/did` → `did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv`

---

## PR 1 → `w3c-ccg/vc-test-suite-implementations`

**File:** `implementations/LearnCard.json` (replace with `w3c-ccg.LearnCard.json`)

**Title:** Update LearnCard: point VC-API endpoints at vc-api.network.learncard.com

**Body:**

Updates the LearnCard implementation for the VC-API Issuer/Verifier suites.

-   **Endpoint** moved from the deprecated `bridge.learncard.com` to our new dedicated,
    stateless VC-API conformance service at `vc-api.network.learncard.com`.
-   **Issuer DID** updated to `did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv`
    (fresh service seed; matches the endpoint's `/did`).
-   **Verifier `id`** populated (was previously empty).

No tag changes — still `vc-api`. Verified against the live endpoint:
VC-API Issuer 13/13 (Data Integrity); VC-API Verifier 17/18 (the one failure is a known
DIDKit `ssi` limitation with non-DID/URL issuers, tracked internally).

---

## PR 2 → `w3c/vc-test-suite-implementations`

**File:** `implementations/LearnCard.json` (replace with `w3c.LearnCard.json`)

**Title:** Update LearnCard: new endpoint + register eddsa-rdfc-2022

**Body:**

Updates the LearnCard implementation for the w3c-org Data Integrity suites.

-   **Endpoint** moved from the deprecated `bridge.learncard.com` to
    `vc-api.network.learncard.com` (dedicated stateless VC-API service).
-   **DID** updated to `did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv`;
    verifier `id` populated.
-   **Newly registers `eddsa-rdfc-2022`** (Data Integrity EdDSA suite) for both issuer
    and verifier, in addition to the existing `Ed25519Signature2020`. A single endpoint
    serves both: the eddsa issuer entry sets
    `options: { type: "DataIntegrityProof", cryptosuite: "eddsa-rdfc-2022" }`.

Verified against the live endpoint: Ed25519Signature2020 issuer/verifier as before;
eddsa-rdfc-2022 issuer-format 14/16 (2 remaining are known DIDKit `ssi`-level items —
data-loss detection + cryptosuiteString typing — tracked internally). eddsa
verify/interop will get their first authoritative results from this suite's CI run.
