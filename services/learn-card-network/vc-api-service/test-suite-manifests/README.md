# W3C Test-Suite Manifests

These are the registration manifests LearnCard submits to the W3C interoperability
test-suite repos. They are the source that [canivc.com](https://canivc.com) renders.

| File                     | Target repo                                                                                         | Path in that repo                |
| ------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------- |
| `w3c-ccg.LearnCard.json` | [`w3c-ccg/vc-test-suite-implementations`](https://github.com/w3c-ccg/vc-test-suite-implementations) | `implementations/LearnCard.json` |
| `w3c.LearnCard.json`     | [`w3c/vc-test-suite-implementations`](https://github.com/w3c/vc-test-suite-implementations)         | `implementations/LearnCard.json` |

## What changed vs. the current live manifests

-   **Endpoint** repointed from the legacy `https://bridge.learncard.com/...` to
    `https://vc-api.network.learncard.com/...` (this service). The legacy
    `bridge.learncard.com` can be retired once these PRs merge and green.
-   **DID** is `did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv`, derived from
    this service's own `SEED` (a fresh seed — the legacy bridge's seed was not
    recovered, which is fine: canivc regenerates from this manifest, so the only
    requirement is that `id` matches the endpoint's `/did`). The `SEED` MUST be stored
    (Infisical `/LearnCard/vc-api-service`) and kept stable — changing it changes the
    DID and breaks these manifests. Verify: `curl https://vc-api.network.learncard.com/did`.
-   **Verifier `id`** filled in (was empty string).

## Cutover steps

1. Deploy this service to `vc-api.network.learncard.com` with the production seed.
2. Confirm `curl https://vc-api.network.learncard.com/did` returns the DID above.
3. Open a PR to each repo replacing `implementations/LearnCard.json` with the matching
   file here.
4. Wait for the suites to re-run; confirm parity on canivc.com.
5. Retire `bridge.learncard.com` / deprecate `@learncard/create-http-bridge`.

## Running the suites locally (to confirm remaining failures)

The last two ambiguous failures (1 VC-API issuer, 1 VC-API verifier) can't be
attributed from canivc's rendered matrix — its passing cells render invisibly. To
get authoritative per-assertion results, run the suites against a reachable endpoint:

```bash
# 1. Bring up the service (or use the deployed staging URL)
cd services/learn-card-network/vc-api-service
SEED=<prod-seed> PORT=3999 bun run start

# 2. Clone the suite + the implementations registry
git clone https://github.com/w3c-ccg/vc-api-issuer-test-suite
git clone https://github.com/w3c-ccg/vc-test-suite-implementations

# 3. Register a LOCAL implementation pointing at the endpoint. The suites read a
#    `localImplementations` entry (see the implementations repo README) — point its
#    issuer/verifier endpoints at http://localhost:3999/credentials/{issue,verify}
#    with the `vc-api` tag.

# 4. Run
cd vc-api-issuer-test-suite && npm i && npm test
```

Mocha prints the exact failing assertion names + diffs — use those to fix the last
two, then re-run before opening the manifest PRs.

## Candidate: EdDSA (`vc-di-eddsa`) registration

`candidate-eddsa-rdfc-2022.json` holds ready-to-merge issuer/verifier entries for the
Data Integrity EdDSA suite. **Not yet registered** — pending validation.

Validation status (run against staging):

-   **Issuer format: 14/16 pass.** Our endpoint emits `DataIntegrityProof` +
    `eddsa-rdfc-2022` when the manifest entry carries
    `options: { type: "DataIntegrityProof", cryptosuite: "eddsa-rdfc-2022" }` (the suite
    forwards `issuer.settings.options` into the issue request).
-   **2 known failures** (DIDKit `ssi`-level, shared with many vendors — fold into the
    ssi ticket): `DATA_LOSS_DETECTION_ERROR` (issuer accepts undefined JSON-LD terms) and
    `cryptosuiteString` subtype typing.
-   **Verify + interop: NOT yet validated** — the suite's own `vc-generator` crashes on
    Node 22 (`structuredClone` DataCloneError). Validate in CI or on Node 18/20 before
    merging these entries.

## Tag expansion (follow-up)

Tags select which suites run. These manifests keep the **currently-known-good** tags
(`vc-api`, `Ed25519Signature2020`) to guarantee no regression on cutover. Adding
suites we already support (eddsa-2022, ecdsa, VC 2.0, did:key, JWT/JOSE) requires
confirming each suite's exact tag string and running it locally against this endpoint
first — do that as a second PR after the endpoint cutover is green.
