# Overview

#### 🎟 Relevant Jira Issues

Fixes: LC-2161

#### 📚 What is the context and goal of this PR?

Hosted signing authorities currently store their signing seeds as plaintext in MongoDB. Anyone with access to a database dump, backup, or the live collection could recover every delegated signing key.

This PR adds envelope encryption for those seeds. Each signing authority receives a unique data-encryption key, the seed is encrypted with AES-256-GCM, and AWS KMS protects the data key with a dedicated customer-managed key. With encrypted writes enabled, new MongoDB records store `encryptedSeed`, `encryptedDek`, and `keyVersion` instead of `seed`. Local development preserves plaintext behavior by default; encryption is opt-in.

The rollout remains backwards compatible while existing records are migrated. The service can temporarily read legacy plaintext records, new encrypted writes can be enabled independently, and a resumable migration verifies every encrypted record before removing its plaintext seed.

Public signing-authority responses and credential-issuance behavior remain unchanged.

#### 🥴 TL; RL:

- Encrypts hosted signing-authority seeds at rest using AWS KMS and AES-256-GCM.
- Keeps existing signing authorities working during a staged migration.
- Adds a private migration Lambda and manual GitHub Actions workflow for `dry-run → prepare → verify → purge`.
- Removes raw seeds from the signing-wallet cache key and prevents stale cached wallets after a record changes.
- Supports local and test environments with a dedicated local key, without falling back to it after a KMS failure.

#### 💡 Feature Breakdown (screenshots & videos encouraged!)

- Added envelope-encryption helpers using AWS SDK v3 `GenerateDataKey` and `Decrypt`.
- Bound each encrypted envelope to its record ID and signing-authority identity using AES-GCM additional authenticated data and KMS encryption context.
- Added typed, fail-closed handling for malformed envelopes, authentication failures, unsupported versions, KMS denial, and KMS availability failures.
- Added structured encryption-failure logs that exclude seeds, data keys, documents, and raw SDK responses.
- Updated signing-authority creation to generate the record ID before encryption and avoid inserting a record when encryption fails.
- Updated credential signing to decrypt only on a signing-wallet cache miss. Warm signing requests do not call KMS.
- Changed the wallet cache key to `${ownerDid}|${name}` and associated entries with the record ID and envelope fingerprint.
- Added an explicit public-response allowlist so seed and encryption fields cannot be returned by the API.
- Added a dedicated KMS key, stage-specific alias, key rotation, retained deletion policy, and execution-role permissions in `serverless.yml`.
- Added a private, single-concurrency migration Lambda with no HTTP endpoint or schedule.
- Restricted KMS access to a dedicated role for signing and migration; Swagger and DID document functions cannot decrypt seeds. Key administrators can delete aliases during stack changes while retaining the key.
- Added resumable migration state, verification receipts, conditional updates, and a worker lease.
- Added ordered scan checkpoints and phase-boundary reconciliation to avoid full collection scans per batch. Final verification rechecks records inserted or changed behind the checkpoint.
- Preserved original migration failures when checkpoint/lease cleanup fails, exposed AWS CLI diagnostics, and logged safe MongoDB error codes without document contents.
- Added a manual GitHub Actions workflow that discovers the deployed migration Lambda through CloudFormation and runs one migration phase at a time.
- Added an operator runbook covering configuration, rollout, verification, monitoring, and rollback.

#### 🛠 Important tradeoffs made:

- The compatibility release temporarily supports plaintext reads and writes so all old Lambda instances can drain before encrypted records are created. These branches are controlled by `SA_SEED_ENCRYPT_WRITES` and `SA_SEED_ALLOW_LEGACY_READ`.
- Signing-wallet cache hits still perform the existing MongoDB lookup. This lets the service compare the record ID and envelope fingerprint before reusing a cached signer, which prevents stale-key reuse after replacement or modification.
- The migration retains plaintext during `prepare` and removes it only during `purge`, after a successful verification and reconciliation pass. This briefly duplicates the secret in a legacy row but makes the destructive step independently verifiable and resumable.
- Local encryption uses a persistent environment key only when KMS is unconfigured and `IS_OFFLINE=true` or `NODE_ENV=test`. A runtime KMS failure never triggers local fallback.
- The KMS key is retained if the stack is deleted or replaced so encrypted database backups remain recoverable.

#### 🔍 Types of Changes

- [x] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Chore (refactor, documentation update, etc)

#### 💳 Does This Create Any New Technical Debt? ( If yes, please describe and [add JIRA TODOs](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2) )

- [ ] No
- [x] Yes

The two rollout flags and the application plaintext-read/write branches are temporary. After every environment reports zero plaintext seed fields and encrypted signing has been verified, a follow-up cleanup issue should remove those runtime compatibility paths. Legacy handling remains in the migration tooling for historical database restoration.

# Testing

#### 🔬 How Can Someone QA This?

##### Automated checks

From the repository root:

```sh
bun install --frozen-lockfile
cd services/learn-card-network/lca-api

bun run test
bun run test:integration
bun run typecheck
bun run check:sa-infra
```

To run only the tests introduced or directly affected by this PR:

```sh
cd services/learn-card-network/lca-api

bun run test \
  src/config/environment.test.ts \
  src/helpers/seedEncryption.helpers.test.ts \
  src/helpers/learnCard.signingAuthority.test.ts \
  src/helpers/learnCard.helpers.test.ts \
  src/migrations/signingAuthoritySeedsCli.test.ts

bun run test:integration -- \
  test/signing-authority-http.spec.ts \
  test/signing-authority.spec.ts \
  test/credentials.spec.ts \
  test/signing-authority-seed-migration.spec.ts
```

##### Local service setup

Use an existing local `.env`, or copy the example and supply the rest of the normal lca-api development values:

```sh
cd services/learn-card-network/lca-api
test -e .env || cp .env.example .env
```

Generate a local key and set these values in `.env`:

```ini
NODE_ENV=development
IS_OFFLINE=true
SA_SEED_KMS_KEY_ARN=
SA_SEED_LOCAL_KEK=<output of: openssl rand -hex 32>
SA_SEED_ENCRYPT_WRITES=true
SA_SEED_ALLOW_LEGACY_READ=true
```

Local development defaults to plaintext writes and legacy reads without a KEK. The settings above explicitly opt into encryption for this QA flow. Keep the same `SA_SEED_LOCAL_KEK` for as long as the local database exists; changing it makes previously encrypted local signing authorities unreadable.

Start the local service using the normal lca-api dependencies and development command:

```sh
bun run start
```

Then:

1. Create a signing authority through the existing API flow.
2. Inspect the raw `signingauthorities` MongoDB document and confirm:
    - `seed` is absent.
    - `encryptedSeed` and `encryptedDek` are non-empty strings.
    - `keyVersion` is `local-v1`.
3. Issue a credential using that signing authority and verify its signature through the existing credential flow.
4. Issue another credential with the same authority and confirm signing still succeeds on the warm cache path.
5. Restart the service and issue again to exercise a cold decrypt.

For a local compatibility check, set `SA_SEED_ENCRYPT_WRITES=false` and `SA_SEED_ALLOW_LEGACY_READ=true`, create an authority, and confirm it can sign. Restore encrypted writes before continuing. The migration worker itself is covered locally by `signing-authority-seed-migration.spec.ts`; the operator CLI and GitHub workflow invoke a deployed private Lambda and should be exercised in staging.

##### Staging rollout QA

1. Deploy with encrypted writes disabled and legacy reads enabled. Confirm existing signing and authority creation still work.
2. Enable encrypted writes while keeping legacy reads enabled. Create a new authority and verify its raw MongoDB record contains no `seed`.
3. Run the manual workflow as four separate runs: `dry-run`, `prepare`, `verify`, and `purge`. Review the reconciliation summary after each run.
4. Confirm `seed` exists on zero documents and every document has a supported encrypted envelope.
5. Issue and verify credentials using both newly created and migrated authorities.
6. Disable legacy reads, redeploy, allow old Lambda invocations to drain, and repeat cold and warm signing checks.
7. Confirm successful and denied KMS operations appear in CloudTrail and that KMS failures return a generic HTTP 500 without secret-bearing logs.

#### 📱 🖥 Which devices would you like help testing on?

Backend and AWS infrastructure only. No device-specific testing is required.

#### 🧪 Code Coverage

Added unit tests for local and KMS round trips, unique data keys and IVs, wrong keys and context, tampered/swapped envelopes, malformed versions, missing fields, KMS denial/timeouts, secret-free logging, DEK buffer cleanup, environment validation, cache keys, cache hits, and stale-wallet prevention.

Added integration tests for raw encrypted MongoDB documents, unchanged public responses, credential issuance, HTTP 500 handling, mixed migration states, idempotent reruns, interrupted phases, conditional-update conflicts, verification failures, purge gating, and concurrent encrypted creation.

Local validation completed:

- 102 lca-api unit tests passed, including CLI diagnostics and rescan handling.
- 33 targeted integration tests passed, including scan checkpoints, cleanup failures, and real MongoDB duplicate-key logging.
- lca-api typecheck passed.
- Infrastructure source checks passed.
- Generated CloudFormation policy and dependency checks passed for 58 resources using an isolated offline package with existing local artifacts and a mocked stack lookup. No AWS deployment was performed; staging IAM, alias deletion, and CloudTrail checks remain pending.
- Documentation and workflow YAML checks passed.
- The lockfile passed installation validation with the repository-pinned Bun version.

# Documentation

#### 📝 Documentation Checklist

**User-Facing Docs** (`docs/` → [docs.learncard.com](https://docs.learncard.com))

- [ ] **Tutorial** — New capability that users need to learn (`docs/tutorials/`)
- [x] **How-To Guide** — New workflow or integration (`docs/how-to-guides/`)
- [ ] **Reference** — New/changed API, config, or SDK method (`docs/sdks/`)
- [ ] **Concept** — New mental model or architecture explanation (`docs/core-concepts/`)
- [ ] **App Flows** — Changes to LearnCard App or ScoutPass user flows (`docs/apps/`)

**Internal/AI Docs**

- [ ] **AGENTS.md** — New pattern, flow, or context that AI assistants need
- [x] **Code comments/JSDoc** — Complex logic that needs inline explanation

**Visual Documentation**

- [ ] **Mermaid diagram** — Complex flow, state machine, or architecture

#### 💭 Documentation Notes

Added `docs/how-to-guides/deploy-infrastructure/signing-authority-seed-encryption.md` and linked it from `docs/SUMMARY.md`. The guide documents local opt-in configuration, AWS resources and permissions, the staged rollout, migration phases and count snapshots, database verification, monitoring, and rollback/restoration. It also covers temporary break-glass key-policy access and why changing authority identity fields requires re-encryption.

# ✅ PR Checklist

- [x] Related to a Jira issue ([create one if not](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2))
- [x] My code follows **style guidelines** (eslint / prettier)
- [ ] I have **manually tested** common end-2-end cases
- [x] I have **reviewed** my code
- [x] I have **commented** my code, particularly where ambiguous
- [x] New and existing **unit tests pass** locally with my changes
- [x] I have completed the **Documentation Checklist** above (or explained why N/A)
- [x] I have considered **product analytics** for user-facing features (use `@analytics` in learn-card-app)

Product analytics are not applicable because this change adds no user-facing UI or product flow.

### 🚀 Ready to squash-and-merge?:

- [x] Code is backwards compatible
- [ ] There is **not** a "Do Not Merge" label on this PR
- [x] I have thoughtfully considered the security implications of this change.
- [x] This change does not expose new public facing endpoints that do not have authentication
