# Encrypt hosted signing-authority seeds

This runbook is for operators deploying the LearnCard Application API (`lca-api`). It upgrades existing signing authorities without changing their signing keys or public responses.

## Storage and configuration

Each authority uses a separate 256-bit data-encryption key. AWS Key Management Service (KMS) generates that key and encrypts it under a dedicated customer-managed key. AES-256-GCM encrypts the authority seed. MongoDB stores `encryptedSeed`, `encryptedDek`, and `keyVersion` instead of `seed`.

`encryptedSeed` is base64 of a 12-byte initialization vector, the encrypted UTF-8 seed, and a 16-byte authentication tag. `encryptedDek` is the KMS ciphertext blob in production. The record ID and a digest of the owner/name/DID are authenticated with both the seed and its data key. Moving an envelope to another record fails authentication.

| Variable                    | Purpose                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `SA_SEED_KMS_KEY_ARN`       | Full KMS key ARN, supplied by CloudFormation in AWS. Aliases are not accepted.                          |
| `SA_SEED_LOCAL_KEK`         | 32-byte hex key for offline/test environments only. Never an automatic fallback after a KMS error.      |
| `SA_SEED_ENCRYPT_WRITES`    | Temporary rollout control. Application default: `true`; initial Serverless deployment default: `false`. |
| `SA_SEED_ALLOW_LEGACY_READ` | Temporary rollout control. Application default: `false`; initial Serverless deployment default: `true`. |

`kms-v1` and `local-v1` identify envelope formats, not individual versions of automatically rotated KMS key material. Retain the same CMK ARN; automatic KMS rotation does not require rewriting documents. Replacing the CMK is a separate operation and is not supported by changing the environment variable alone.

Offline development requires `IS_OFFLINE=true` and a persistent local key. Generate one using:

```sh
openssl rand -hex 32
```

Store the result as `SA_SEED_LOCAL_KEK` in your local environment and retain it for as long as that database exists. Unit tests and disposable Docker previews use a fixed test-only value. Do not copy that value into a persistent deployment. An offline process configured with a KMS ARN still uses KMS and will not downgrade to the local provider.

## Infrastructure and permissions

`serverless.yml` manages the CMK, alias, execution-role policy, and private migration Lambda. Each service/stage gets its own key. Deleting or replacing the stack retains the key. The key policy allows cryptographic operations only to the lca-api execution role, with the expected encryption purpose; it separately grants account administrators key-management permissions. Administrators who can change the key policy can change that boundary.

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

- **Prepare:** conditionally adds ciphertext to legacy records, retaining the original seed. Reads the persisted envelope back and verifies it decrypts to exactly the original seed. Rerunning does not replace completed envelopes.
- **Verify:** decrypts all records, compares any retained plaintext, and writes ciphertext-only receipts into `signingauthorityseedverification`. Receipts are matched against current document values, so new or changed documents remain pending. A completed pass records its counts and verification epoch in `signingauthorityseedmigration`.
- **Purge:** requires that completed verification epoch and `encrypted == total`, with no malformed or legacy-only rows. Rechecks the receipt and decrypts every retained seed before a conditional `$unset`. A changed record blocks deletion and requires another verification pass. New encrypted-only authorities can continue to be created.

Each batch logs `total`, `encrypted`, `legacyOnly`, `malformed`, `plaintextRemaining`, and its processed count. Any failure exits nonzero and closes the purge gate. Correct the underlying error, rerun `verify`, then resume `purge`. Never bypass the gate by manually editing its state document. An invocation killed by a timeout can leave a lease for up to 16 minutes; wait for expiry and rerun. Ordinary interrupted client invocations may still be executing in Lambda.

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

1. The deployed role can create an authority and sign using its encrypted seed. A distinct principal must receive `AccessDenied` for this key's Decrypt operation, even if its identity policy is broad. Test with a synthetic ciphertext fixture, never a production seed or plaintext data key.
2. Both successful and denied KMS requests appear in CloudTrail. The migration Lambda can reach MongoDB and KMS through the configured network.
3. Repeated warm signing calls add zero KMS calls; a successful cold authority load adds exactly one Decrypt call. The SDK has no automatic retries on the request path and uses bounded connection/request timeouts. Compare staging warm/cold latency before and after the change.
4. Disabled-key/access-denied scenarios on an isolated staging test produce 5xx responses and `signing_authority_seed_failure` logs containing only operation, record ID, version, category, and AWS request ID. Restore access before proceeding. Warm cached signing instances retain their key until eviction/restart; immediate revocation is outside this change.

These checks validate infrastructure behavior and latency; local tests alone cannot establish real AWS permissions or networking.

## Rollback and restoration

Before encrypted writes start, the compatibility release can be rolled back normally. Once encrypted writes start, **do not roll back to a plaintext-only reader**: newly created records no longer contain a plaintext seed.

Use an encryption-capable artifact for rollback, with encrypted writes still enabled. Leave the CMK, its alias/policies, and database ciphertext intact. Before purge, a defective migration can be stopped without deleting retained plaintext; fix it and resume prepare/verify. After purge, roll back application code only to an encryption-capable version; do not reconstruct plaintext rows as a rollback step.

Restore encrypted backups with the **original retained CMK**, in the correct region, and an authorized lca-api execution role. A newly generated key cannot decrypt old envelopes. If a deleted stack's role was recreated, administrators must repair the original key policy through infrastructure-as-code before recovery. Restore an older plaintext backup only into an isolated environment with the compatibility reader, immediately run prepare/verify/purge, and keep plaintext writes disabled before returning it to service.
