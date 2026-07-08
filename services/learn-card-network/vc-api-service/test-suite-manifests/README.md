# W3C Test-Suite Manifests

These are the registration manifests LearnCard submits to the W3C interoperability
test-suite repos. They are the source that [canivc.com](https://canivc.com) renders.

| File                     | Target repo                                                                                         | Path in that repo                |
| ------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------- |
| `w3c-ccg.LearnCard.json` | [`w3c-ccg/vc-test-suite-implementations`](https://github.com/w3c-ccg/vc-test-suite-implementations) | `implementations/LearnCard.json` |
| `w3c.LearnCard.json`     | [`w3c/vc-test-suite-implementations`](https://github.com/w3c/vc-test-suite-implementations)         | `implementations/LearnCard.json` |

## What changed vs. the current live manifests

-   **Endpoint** repointed from the legacy `https://bridge.learncard.com/...` to
    `https://vc-api.learncard.com/...` (this service). The legacy `bridge.learncard.com`
    can be retired once these PRs merge and green.
-   **DID unchanged** (`did:key:z6MkjSz4...`). This service must be deployed with the
    **same seed** the bridge used (`WALLET_SEED` → `SEED`) so its `/did` matches this
    `id`. Verify after deploy: `curl https://vc-api.learncard.com/did`.
-   **Verifier `id`** filled in (was empty string).

## Cutover steps

1. Deploy this service to `vc-api.learncard.com` with the production seed.
2. Confirm `curl https://vc-api.learncard.com/did` returns the DID above.
3. Open a PR to each repo replacing `implementations/LearnCard.json` with the matching
   file here.
4. Wait for the suites to re-run; confirm parity on canivc.com.
5. Retire `bridge.learncard.com` / deprecate `@learncard/create-http-bridge`.

## Tag expansion (follow-up)

Tags select which suites run. These manifests keep the **currently-known-good** tags
(`vc-api`, `Ed25519Signature2020`) to guarantee no regression on cutover. Adding
suites we already support (eddsa-2022, ecdsa, VC 2.0, did:key, JWT/JOSE) requires
confirming each suite's exact tag string and running it locally against this endpoint
first — do that as a second PR after the endpoint cutover is green.
