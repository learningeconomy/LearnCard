# Encrypt hosted signing-authority seeds

This runbook is for operators deploying the LearnCard Application API (`lca-api`). It upgrades existing signing authorities without changing their signing keys or public responses.

## Storage and configuration

Each authority uses a separate 256-bit data-encryption key. AWS Key Management Service (KMS) generates that key and encrypts it under a dedicated customer-managed key. AES-256-GCM encrypts the authority seed. MongoDB stores `encryptedSeed`, `encryptedDek`, and `keyVersion` instead of `seed`.

`encryptedSeed` is base64 of a 12-byte initialization vector, the encrypted UTF-8 seed, and a 16-byte authentication tag. `encryptedDek` is the KMS ciphertext blob in production. The record ID and a digest of the owner/name/DID are authenticated with both the seed and its data key. Moving an envelope to another record fails authentication.

| Variable                    | Purpose                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SA_SEED_KMS_KEY_ARN`       | Full KMS key ARN, supplied by CloudFormation in AWS. Aliases are not accepted.                                 |
| `SA_SEED_LOCAL_KEK`         | 32-byte hex key for offline/test environments only. Never an automatic fallback after a KMS error.             |
| `SA_SEED_ENCRYPT_WRITES`    | Temporary rollout control. Offline development: `false`; online/test: `true`; initial AWS deployment: `false`. |
| `SA_SEED_ALLOW_LEGACY_READ` | Temporary rollout control. Offline development: `true`; online/test: `false`; initial AWS deployment: `true`.  |

`kms-v1` and `local-v1` identify envelope formats, not individual versions of automatically rotated KMS key material. Retain the same CMK ARN; automatic KMS rotation does not require rewriting documents. Replacing the CMK is a separate operation and is not supported by changing the environment variable alone.

Offline development (`IS_OFFLINE=true`, outside `NODE_ENV=test`) preserves plaintext writes and legacy reads by default. No local encryption key is needed for this mode. Encryption is opt-in: generate a local key using:

```sh
openssl rand -hex 32
```

Store the result as `SA_SEED_LOCAL_KEK`, set `SA_SEED_ENCRYPT_WRITES=true`, and retain the key for as long as that database exists. Keep `SA_SEED_ALLOW_LEGACY_READ=true` until existing plaintext records are migrated. Unit tests and disposable Docker test/preview stacks explicitly exercise encryption with a fixed test-only key. Do not copy that value into a persistent deployment. An offline process configured with a KMS ARN still uses KMS for encryption and will not downgrade to the local provider.

Disabling encrypted writes later affects only new records. Existing encrypted records still need their original KEK to sign; without it, signing fails closed. Turning off encrypted writes never converts existing ciphertext back into plaintext.

## Existing local Docker databases

The app Compose configurations (`apps/learn-card-app/compose.yaml`, `apps/learn-card-app/compose-local.yaml`, and `apps/scouts/compose-local.yaml`) load `lca-api/compose.env` before the optional service `.env` files. These local-only defaults disable encrypted writes and allow legacy plaintext reads, without supplying a KEK. This lets a missing or older `.env` start successfully and keeps existing plaintext authorities usable. Online/test defaults and AWS configuration are unchanged.

Values explicitly set in `services/learn-card-network/lca-api/.env` override these defaults; ScoutPass also loads `.env.scouts` last. In particular, an existing custom KEK and explicit encryption opt-in are preserved. To test encryption, set `SA_SEED_ENCRYPT_WRITES=true` and supply a unique `SA_SEED_LOCAL_KEK`. If an older `.env` explicitly disables legacy reads but your database still has plaintext records, set `SA_SEED_ALLOW_LEGACY_READ=true` until migration is complete. Once records are encrypted, keep their original key; changing it does not re-encrypt existing records.

Recreate the `api` container after editing environment values (`docker compose -f apps/learn-card-app/compose-local.yaml up -d --force-recreate api` from the repository root). A container restart alone does not reload Compose environment settings.

The operator CLI invokes AWS Lambda, but the migration worker can also run directly inside the local API container, using the same database, KEK, and rollout flags as the service. With all local writers using `SA_SEED_ENCRYPT_WRITES=true`, run this from the repository root:

```sh
docker compose -f apps/learn-card-app/compose-local.yaml exec -T \
  -e SA_MIGRATION_PHASE=dry-run \
  -w /app/services/learn-card-network/lca-api api bun -e '
import { environment } from "./src/config/environment";
import { client, mongodb } from "./src/mongo";
import { runSeedMigrationBatch, SeedMigrationError } from "./src/migrations/signingAuthoritySeeds";

try {
    let result;
    do {
        result = await runSeedMigrationBatch(
            mongodb,
            { phase: process.env.SA_MIGRATION_PHASE, batchSize: 50 },
            { encryptedWritesEnabled: environment.SA_SEED_ENCRYPT_WRITES }
        );
        if (!result.done && result.processed === 0 && !result.rescanRequired) throw new Error("No progress");
    } while (!result.done);
} catch (error) {
    console.error(error instanceof SeedMigrationError ? error.category : "operation_failed");
    process.exitCode = 1;
} finally {
    await client.close();
}
'
```

Repeat the command with `SA_MIGRATION_PHASE=prepare`, then `verify`, then `purge`, reviewing the logged counts after each phase. Substitute the ScoutPass Compose path when using that stack. These commands change the selected local database; no AWS deployment is needed. After purge, confirm `plaintextRemaining=0`, `encrypted=total`, and `malformed=0`. Local envelopes use `local-v1`, so use that version for the direct MongoDB checks below. Finally set `SA_SEED_ALLOW_LEGACY_READ=false` in the service `.env`, recreate the API container, and test signing again after the cache has cleared.

## Infrastructure and permissions

`serverless.yml` manages the CMK, alias, execution-role policy, and private migration Lambda. Each service/stage gets its own key. Deleting or replacing the stack retains the key. The key policy grants cryptographic operations directly to `SigningAuthorityExecutionRole`, used only by `api`, `trpc`, and `seedMigration`, with the expected encryption purpose. `swagger` and `didWeb` use the generated role and cannot decrypt seeds. The matching standalone IAM policy documents scope and establishes deployment ordering; the key policy itself grants access. Account administrators have separate key-management permissions and can change this boundary.

Alias management includes `kms:DeleteAlias` on the key so alias replacement and stack teardown can finish while retaining the CMK. Deployment credentials also need the corresponding permission on the alias through IAM; see [AWS alias permissions](https://docs.aws.amazon.com/kms/latest/developerguide/alias-access.html). `kms:GetKeyPolicy` is included in key administration; account-wide `kms:ListAliases`, if needed by an operator, belongs in their IAM policy.

The migration function uses the same execution role and private subnet as lca-api. It has no HTTP endpoint, function URL, or schedule. The manually triggered **Migrate Signing Authority Seeds** GitHub Actions workflow is the normal operator entry point. Its AWS credentials need `cloudformation:DescribeStacks` and `lambda:InvokeFunction`; operators do not need database credentials or KMS Decrypt access on their workstations. The function's reserved concurrency is one. The existing NAT route provides access to KMS; no additional network infrastructure is required.

CloudFormation outputs expose `SigningAuthoritySeedKeyArn` and `SigningAuthoritySeedMigrationFunctionName`. Deployment credentials must be permitted to manage KMS keys/aliases and IAM policies in addition to the existing service resources.

KMS operations appear in CloudTrail by default. Before rollout, verify that the account's retained trail includes **read management events** and does not exclude `kms.amazonaws.com`. See [AWS KMS logging](https://docs.aws.amazon.com/kms/latest/developerguide/logging-using-cloudtrail.html). Encryption context is visible in those logs and contains no seed or data key.

## Staged live rollout

Repeat the complete process in staging before production. Run commands below from `services/learn-card-network/lca-api` and substitute the intended service/stage/region. Do not run migration while any old plaintext writer is still serving traffic.

1. Deploy this encryption-capable release with `SA_SEED_ENCRYPT_WRITES=false` and `SA_SEED_ALLOW_LEGACY_READ=true`. These are the initial CloudFormation defaults. Wait for every API/tRPC function to finish updating and existing invocations to drain. Confirm ordinary creation and signing still work. This release intentionally still writes plaintext so older readers remain compatible during deployment.
2. Set `SA_SEED_ENCRYPT_WRITES=true` and keep `SA_SEED_ALLOW_LEGACY_READ=true`; deploy again. In GitHub Actions, set these variables in **each lca-api deployment environment**. For direct deployments, use the equivalent Serverless parameters `--param="saSeedEncryptWrites=true" --param="saSeedAllowLegacyRead=true"`. Wait for deployment completion and old invocations to drain. Inspect a newly created authority: it must contain an envelope and no `seed`.
3. Open **Actions → Migrate Signing Authority Seeds**, select the lca-api GitHub Environment, and run `dry-run`, `prepare`, `verify`, and `purge` as four separate workflow runs. The workflow discovers the migration function from the CloudFormation output. The migration Lambda refuses mutating phases unless its deployed encrypted-write flag is enabled, causing the workflow to fail. The operator must still confirm all API/tRPC writers have finished updating.
4. After purge completes, run the direct database checks below and issue/verify a credential using both a new and a migrated authority. Set `SA_SEED_ALLOW_LEGACY_READ=false`, retain encrypted writes, and deploy again. Recheck signing after cold starts.
5. Only after every supported deployment has completed this process, ship the cleanup release: remove the legacy branch in `decryptSigningAuthoritySeed`, the plaintext-write branch in creation, legacy cache-fingerprint handling, and both rollout controls from runtime configuration, CI, and Serverless. Keep historical-record types and seed comparisons in migration tooling. Do not remove compatibility before the deployment evidence exists.

The workflow is manual-only, runs exclusively from `main`, uses the selected protected GitHub Environment, and permits only one run per environment at a time. `dry-run` is the default phase. Configure required reviewers on production GitHub Environments before rollout. Every run writes the final sanitized reconciliation counts to the GitHub job summary and never returns plaintext.

Run each phase separately and review its summary before starting the next one:

```text
dry-run → prepare → verify → purge
```

The scripts are resumable and default to a read-only inventory. For local operator fallback, set the following non-secret values and invoke the same worker directly:

```sh
export SA_MIGRATION_FUNCTION="lca-api-service-dev-seedMigration"
export SA_MIGRATION_REGION="us-east-1"

bun run migrate:sa-seeds --function-name "$SA_MIGRATION_FUNCTION" --region "$SA_MIGRATION_REGION" --phase dry-run
bun run migrate:sa-seeds --function-name "$SA_MIGRATION_FUNCTION" --region "$SA_MIGRATION_REGION" --phase prepare
bun run migrate:sa-seeds --function-name "$SA_MIGRATION_FUNCTION" --region "$SA_MIGRATION_REGION" --phase verify
bun run migrate:sa-seeds --function-name "$SA_MIGRATION_FUNCTION" --region "$SA_MIGRATION_REGION" --phase purge
```

Use `--batch-size 1` through `100` to adjust load, or `--one-batch` to stop after one invocation. The default batch size is 50. The operator script requires AWS CLI v2 and uses its normal credential/profile configuration. It invokes synchronously with a timeout suitable for the 15-minute function.

Review the production `dry-run` total before `prepare`. For large collections, measure a few bounded batches in staging to choose a batch size and maintenance window. Full count reconciliation runs at phase start and at the end of an ordered scan, not after every batch. Intermediate results contain the last reconciliation snapshot with `countsReconciled: false`; use `processed` for batch progress. A completed phase always returns fresh counts with `countsReconciled: true`.

- **Prepare:** conditionally adds ciphertext to legacy records, retaining the original seed. Reads the persisted envelope back and verifies it decrypts to exactly the original seed. Rerunning does not replace completed envelopes.
- **Verify:** decrypts all records, compares any retained plaintext, and writes ciphertext-only receipts into `signingauthorityseedverification`. An indexed BSON ID checkpoint bounds each batch. At the end of the scan, a full comparison against current records catches new or changed documents behind the checkpoint; `rescanRequired: true` resets the scan and the CLI continues automatically. A completed pass records its reconciled counts and verification epoch in `signingauthorityseedmigration`.
- **Purge:** requires that completed verification epoch and `encrypted == total`, with no malformed or legacy-only rows. Rechecks the receipt and decrypts every retained seed before a conditional `$unset`. A changed record blocks deletion and requires another verification pass. New encrypted-only authorities can continue to be created.

Each batch logs `total`, `encrypted`, `legacyOnly`, `malformed`, `plaintextRemaining`, `countsReconciled`, and its processed count. The purge gate is cleared before processing and restored only by a completed verification or a successful purge batch. On failure, correct the underlying error, rerun `verify`, then resume `purge`. Never bypass the gate by manually editing its state document. Failed failure-checkpoint or lease-release writes are logged separately without replacing the original error. If releasing the lease fails, even after a successful batch, or an invocation is killed by a timeout, wait up to 16 minutes for expiry before retrying. Ordinary interrupted client invocations may still be executing in Lambda.

Direct MongoDB checks after purge:

```javascript
db.signingauthorities.countDocuments({ seed: { $exists: true } }); // must be 0
db.signingauthorities.countDocuments({
    keyVersion: 'kms-v1',
    encryptedSeed: { $type: 'string' },
    encryptedDek: { $type: 'string' },
    seed: { $exists: false },
}); // must equal db.signingauthorities.countDocuments({})
```

Do not export entire records for logging or verification. Existing legacy backups, snapshots, and database history are not rewritten by `$unset`; restrict and retire those artifacts under the applicable retention policy. New backups after purge contain encrypted seed fields.

## Validation and monitoring

From the service directory:

```sh
bun run test
bun run test:integration
bun run typecheck
bun run check:sa-infra
# After packaging with the normal service build/layer preparation:
bun run check:sa-infra .serverless/cloudformation-template-update-stack.json
```

The infrastructure check verifies key retention, role/purpose restrictions, the private worker, and the resource dependency graph. Database integration tests inspect new/migrated records directly, exercise crash recovery and conditional-write conflicts, and verify HTTP credential issuance and generic 500 responses.

Before production, use staging to verify:

1. The signing role can create an authority and sign using its encrypted seed. A distinct principal, including the generated role used by `swagger` and `didWeb`, must receive `AccessDenied` for this key's Decrypt operation, even if its identity policy is broad. Test with a synthetic ciphertext fixture, never a production seed or plaintext data key.
2. Both successful and denied KMS requests appear in CloudTrail. The migration Lambda can reach MongoDB and KMS through the configured network.
3. Repeated warm signing calls add zero KMS calls; a successful cold authority load adds exactly one Decrypt call. The SDK has no automatic retries on the request path and uses bounded connection/request timeouts. Compare staging warm/cold latency before and after the change.
4. Disabled-key/access-denied scenarios on an isolated staging test produce 5xx responses and `signing_authority_seed_failure` logs containing only operation, record ID, version, category, and AWS request ID. Restore access before proceeding. Warm cached signing instances retain their key until eviction/restart; immediate revocation is outside this change.

These checks validate infrastructure behavior and latency; local tests alone cannot establish real AWS permissions or networking.

## Rollback and restoration

Before encrypted writes start, the compatibility release can be rolled back normally. Once encrypted writes start, **do not roll back to a plaintext-only reader**: newly created records no longer contain a plaintext seed.

Use an encryption-capable artifact for rollback, with encrypted writes still enabled. Leave the CMK, its alias/policies, and database ciphertext intact. Before purge, a defective migration can be stopped without deleting retained plaintext; fix it and resume prepare/verify. After purge, roll back application code only to an encryption-capable version; do not reconstruct plaintext rows as a rollback step.

Restore encrypted backups with the **original retained CMK**, in the correct region, and an authorized lca-api execution role. A newly generated key cannot decrypt old envelopes. If a deleted stack's role was recreated, administrators must repair the original key policy through infrastructure-as-code before recovery. Restore an older plaintext backup only into an isolated environment with the compatibility reader, immediately run prepare/verify/purge, and keep plaintext writes disabled before returning it to service.

For break-glass restoration using a different role, a key administrator must first update the original CMK policy: add the recovery role to the `DenyOtherCryptographicPrincipals` exception **and** grant that role `kms:Decrypt` with the existing encryption-purpose condition. An IAM allow alone cannot override the explicit deny. Preserve the normal signing-role grant and administrative access. Record the temporary policy through infrastructure-as-code, use an isolated recovery process with the original record identity and encryption context, and confirm the operations in CloudTrail. Remove the temporary grant and deny exception after recovery and verify the role can no longer decrypt. Do not print recovered seeds or DEKs.

The envelope authenticates `_id`, `ownerDid`, `name`, and `did`, including an absent DID. Renaming an authority or backfilling its DID requires decrypting with the original metadata, re-encrypting with the new identity, and atomically updating metadata and ciphertext together. A metadata-only update makes the existing envelope fail authentication.
