# Staging bring-up and verification runbook

This is the operational runbook for standing up the Nitro escrow enclave stack in staging and
verifying it end-to-end. It complements `README.md` (threat model, wire contract, local
development) and `../../infra/escrow-enclave/README.md` (Terraform reference) — it does not repeat
either in full.

> **Two launch blockers below (Roughtime, D10) are OPEN as of this writing.** Steps 6 and 7 cannot
> succeed until the Roughtime blocker is resolved. Read "Open launch blockers" before starting.

## 1. Terraform apply order

Follow `../../infra/escrow-enclave/README.md` exactly; in summary, dependency order is:
VPC/network data lookups → KMS CMK + key policy → DynamoDB ledger tables (`records`, `heads`) + S3
(audit bucket with Object Lock, EIF artifacts bucket) → IAM roles (enclave-host, monitor) →
compute (launch template, ASG, internal NLB) → monitor Lambda + EventBridge + SNS + CloudWatch
alarms. Key-policy changes require the two-person procedure documented there (CODEOWNERS review +
a second, MFA-authenticated `escrow-kms-admin` applies).

## 2. Measurements: CI artifact → tfvars → tenant config

1. CI (`.github/workflows/escrow-enclave-eif.yml`) builds the EIF twice, diffs PCR0, and publishes
   `escrow-measurements.json` (`{pcr0, pcr1, pcr2, imageTag, sourceDateEpoch, gitCommit,
eifSha256}`) as a workflow artifact, plus commits it to `security/` on tag.
2. Copy `pcr0`/`pcr1`/`pcr2` into `infra/escrow-enclave/escrow-measurements.tfvars` under
   `enclave_measurements` (add as a new tuple alongside the currently-deployed one during a
   rotation — do not remove the old tuple until every instance has rolled, per the measurement
   rotation procedure in `infra/escrow-enclave/README.md`).
3. Copy the same three values into the target tenant's `environments/<tenant>.json` under
   `auth.sss.escrowEnclaveMeasurements` (see `packages/learn-card-base/src/config/
tenantConfigSchema.ts`). **The Terraform tfvars and the tenant config must reference the same
   measurement tuple(s)** — a client pinned to a PCR tuple the KMS key policy doesn't grant for
   (or vice versa) fails closed on both sides, which is the correct but confusing failure mode if
   these two get out of sync.
4. Re-run `terraform apply` (KMS key-policy change → two-person procedure) and rebuild/republish
   the tenant config (`bun scripts/prepare-native-config.ts <tenant>`) before rolling clients.

## 3. Deploy the host binary + EIF

Reference `services/escrow-enclave-host/README.md` for the full env var contract. At minimum:

| Var                                                                     | Purpose                                                        |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ESCROW_ENCLAVE_TOKEN_FILE` (preferred) / `ESCROW_ENCLAVE_REMOTE_TOKEN` | Bearer token lca-api authenticates to the host with            |
| `ESCROW_LEDGER_RECORDS_TABLE` / `ESCROW_LEDGER_HEADS_TABLE`             | DynamoDB ledger table names (Terraform outputs)                |
| `ESCROW_AUDIT_BUCKET`                                                   | S3 Object Lock audit bucket                                    |
| `ESCROW_SEALED_KEY_OBJECT`                                              | S3 key for the KMS-sealed escrow private key blob              |
| `ESCROW_KEY_ID`                                                         | Logical key id — must match the tenant config's enclave key id |
| `ESCROW_KMS_REGION` / `ESCROW_KMS_KEY_ARN`                              | The escrow CMK                                                 |

Roll the ASG to the new EIF via the launch template (Terraform `compute.tf`), then confirm the
host's `/health` endpoint (via the internal NLB) reports healthy before pointing lca-api at it.

Set lca-api's `ESCROW_ENCLAVE_MODE=remote`, `ESCROW_ENCLAVE_REMOTE_URL=<internal NLB URL>`,
`ESCROW_ENCLAVE_REMOTE_TOKEN=<same token as above>`.

## 4. First-boot provisioning

On the very first boot of a brand-new escrow CMK (no sealed key exists yet in
`ESCROW_SEALED_KEY_OBJECT`), set `ESCROW_ALLOW_FIRST_BOOT=true` on **both** the host and the
enclave. Per `services/escrow-enclave-host/README.md`: "Missing ciphertext fails closed by
default; an operator must explicitly enable `ESCROW_ALLOW_FIRST_BOOT=true` on host AND enclave for
provisioning. Even then only S3's specific `NoSuchKey` result permits a null blob; access/transport
errors never permit regeneration." `persistKey` is only reachable with this flag set, and always
uses a conditional insert (cannot silently overwrite an existing sealed key).

**Turn the flag off immediately after confirming the key was sealed** (redeploy the host/enclave
without it). Leaving it set is a standing risk: any future accidental S3 object loss would
silently regenerate a _new_ escrow keypair rather than failing closed, invalidating every
previously-enrolled user's escrow blob.

## 5. Non-root `/dev/nsm` access (open item from the P2.1 review)

The Dockerfile runs the enclave process as `USER 65532:65532` (non-root). Whether `/dev/nsm` and
the enclave's vsock socket are accessible to that non-root UID **inside a real running Nitro
Enclave** is **UNVERIFIED** — this could not be tested during development (no Nitro hardware, no
`nitro-cli`, no EC2). This is the first thing to check on the very first real staging boot:

1. After `nitro-cli run-enclave`, check the enclave's own logs (via the CloudWatch log group, or
   `nitro-cli console --enclave-id <id>`) for any permission-denied error touching `/dev/nsm` or
   the vsock device.
2. If access fails under UID 65532, the fallback is an explicit, reviewed `USER 0:0` in the
   Dockerfile — this is a deliberate revert, not a silent patch. Flag it back to the orchestrator /
   security review rather than changing it unilaterally, since it changes the container's
   privilege posture.
3. If access succeeds, record that confirmation here (update this section) so future readers don't
   re-litigate it.

## 6. Run the e2e spec against staging

> **Blocked by the open Roughtime item below** — every release attempt will fail closed with
> `InsufficientSources` until a second production-grade time source is provisioned. Steps in this
> section can be rehearsed (attestation, enrollment, PIN release, early-hold-refusal, tamper
> refusal) but the hold-release path itself cannot succeed end-to-end yet.

```sh
ESCROW_E2E=1 \
ESCROW_E2E_LCA_API_URL=https://<staging-lca-api-host> \
ESCROW_E2E_PINNED_PCRS='{"pcr0":"<pcr0>","pcr1":"<pcr1>","pcr2":"<pcr2>"}' \
ESCROW_E2E_ROOT_SHA256=641a0321a3e244efe456463195d606317ed7cdcc3c1756e09893f3c68f79bb5b \
ESCROW_E2E_MONGO_URI=<staging mongo URI, least-privilege test/tamper credentials if available> \
bunx nx test:e2e e2e --testFile=tests/e2e/tests/escrow-nitro.spec.ts
```

Auth caveat: the spec's `makeMockToken()` helper only works when the target lca-api has
`IS_E2E_TEST` or `IS_OFFLINE` set server-side (true for local docker-compose, deliberately NOT true
for a real staging deployment). Running the enroll/PIN/tamper cases against staging therefore
needs either (a) a real Firebase test user + a genuine ID token, or (b) a dedicated non-production
staging tier that intentionally sets one of those flags. Neither is wired up by this task — decide
which approach staging uses before running the full spec there, and update this section with the
answer.

The spec's fixture-based hold-duration-elapses test is **always skipped against staging** (no
fixture file mechanism exists against a real enclave) — see step 7 for the real equivalent.

## 7. Manual 7-day soak (the real hold-duration test)

Since staging cannot fast-forward time, the actual 7-day wait must be exercised manually once
Roughtime is resolved:

1. Day 0: run just the "enroll, hold" portion of the e2e spec (or an equivalent one-off script)
   against staging, and record the returned `holdId`/`resumeToken`.
2. Day 7+: run just the "complete recovery" portion against the same `holdId`/`resumeToken`, and
   confirm release actually succeeds against the real enclave's real Roughtime-derived clock.
3. Record the result (success/failure, and if failure, the exact `ErrorCode`) here or in the launch
   sign-off doc — this is the one guarantee (hold really lasts 7 days, release really works after)
   that cannot be automated in CI.

## 8. Verify the monitor alarms fire

Per `services/escrow-ledger-monitor/README.md`. Use the Terraform outputs for the real table/bucket
names (`<records-table>`, `<audit-bucket>` below are placeholders — substitute your actual
`terraform output` values, do not assume names):

**`LedgerIntegrityFailure` (tamper on the records table):**

```sh
aws dynamodb update-item \
  --table-name <records-table> \
  --key '{"pk": {"S": "<an existing HOLD#... key>"}, "sk": {"S": "<an existing SEQ#... key>"}}' \
  --update-expression "SET signature = :s" \
  --expression-attribute-values '{":s": {"S": "tampered"}}'
```

Confirm the resulting `MODIFY` stream event fires `LedgerIntegrityFailure` on the monitor's
`ALARM_TOPIC` SNS topic within its polling interval — the monitor treats any `MODIFY`/`REMOVE` on
this table as tampering by design (application logic never legitimately updates or deletes a
written ledger record).

**`AuditMismatch` (delete the matching S3 object):**

```sh
aws s3 rm s3://<audit-bucket>/audit/<tenant>/<chainId>/<seq>-<record_hash>.cbor
```

Confirm the monitor's next sweep (every 15 minutes per its README) alarms `AuditMismatch`.

Do this against a **disposable** test hold/tenant, not a real user's data — both actions are
destructive to that ledger record's audit trail.

## 9. Kill switch (for incident response, not routine ops)

If tampering, an unauthorized KMS governance change, or persistent unexplained audit divergence is
suspected: set lca-api's `ESCROW_RELEASE_KILL_SWITCH=true` and redeploy/restart every serving API
instance. Confirm `startRecovery`/`completeRecovery` are refused afterward. This does **not**
retroactively undo any release that already completed, and the monitor never flips this switch
itself (it has a read-only IAM role) — this is always a manual, human decision.

## 10. Teardown

Reverse the apply order (compute/monitor → IAM → DynamoDB/S3/KMS → network). **Do not blanket
`terraform destroy` the KMS CMK or the DynamoDB ledger tables / S3 audit bucket as part of routine
compute teardown** — those hold the audit trail and, in the CMK's case, the only path to ever
decrypt already-sealed escrow blobs. Destroying compute (ASG, NLB, host) is safe and reversible;
destroying the CMK or ledger storage is not.

## Open launch blockers

These are launch-blocking, not "nice to have later" — call them out explicitly whenever staging
verification is attempted, don't bury them in a footnote.

### Second production-grade Roughtime source (blocks steps 6 and 7)

The enclave's 7-day hold requires **at least 2 independent, overlapping signed time sources**
(D2/D3) and fails closed otherwise. Today only Cloudflare's Roughtime server
(`roughtime.cloudflare.com:2003`) is realistically reachable, and Cloudflare's own documentation
says "DO NOT USE IN PRODUCTION"; Google's server is a historical sandbox key with no uptime
guarantee. With `min_sources=2` enforced in `RoughtimeTimeSource::production()` (itself gated
behind the `verified-roughtime-keys` feature as a release-review gate), **every real release
attempt today would fail closed with `InsufficientSources`.** This needs an explicit
product/security decision before any real user can complete a hold-based release in production or
staging:

- (a) add more independent, verified Roughtime operators and pin ≥3, requiring 2, or
- (b) run LearnCard-operated Roughtime servers in two separate AWS accounts/regions with keys held
  outside the enclave-host account, or
- (c) accept and explicitly sign off on a documented, weaker "1 external + ledger monotonicity"
  model (contradicts D2 as currently written — would need its own decision record).

Not blocked: continued implementation/testing work using `FakeTimeSource` (local dev, CI). Blocked:
any real staging or production hold-based release.

### D10: `escrow-kms-admin` can still rewrite the KMS key policy (residual, mitigated, not eliminated)

An MFA-authenticated `escrow-kms-admin` session can call `kms:PutKeyPolicy` to add an unconditioned
`kms:Decrypt` Allow, fully removing the attestation gate — Terraform/IAM cannot prevent a
sufficiently-privileged admin from changing the very policy that grants their own privilege.
Mitigations already layered in (per `infra/escrow-enclave/README.md`'s "Residual risk: key
administrators" section):

- CODEOWNERS-required two-person PR review on any change to `enclave_measurements` or
  `kms_admin_role_arn` (process control, not AWS-enforced),
- a `DenyPutKeyPolicyWithoutMFA` statement (raises the bar to "MFA-authenticated session", does not
  eliminate a deliberate insider with a working MFA device),
- `kms:CreateGrant` removed entirely from the admin action list (closed a real bypass — an admin
  could otherwise create a grant instead of editing the policy directly),
- explicit `Deny kms:Decrypt` statements matching the all-zero debug-mode PCR0/ImageSha384 values.

**Not yet confirmed done**: a CloudTrail alarm on `PutKeyPolicy`/`CreateGrant`/`ScheduleKeyDeletion`
against the escrow CMK was tracked as a P7.1 follow-up. `services/escrow-ledger-monitor/README.md`
lists `EscrowKmsGovernanceChange` as a documented alarm signal — **before treating D10 as fully
mitigated, confirm this alarm is actually wired to real CloudTrail events in the deployed monitor
Terraform (`monitor.tf`) and firing in staging, not just documented as a signal name.** If it turns
out to still be a stub, that gap should be closed (or explicitly re-accepted) before general
availability, per the residual-risk sign-off process described in `infra/escrow-enclave/README.md`.

The alternative of an **immutable key policy** (`bypass_policy_lockout_safety_check = true`, no
principal — including root — retains `kms:PutKeyPolicy`) was considered and rejected for now: it
would close this risk entirely, but makes every future measurement rotation require provisioning a
brand-new CMK and re-sealing the escrow private key to it, instead of an in-place policy edit — a
materially more disruptive rotation procedure. Revisit only as an explicit, signed-off decision if
a future security review judges the residual risk unacceptable even with two-person review.
