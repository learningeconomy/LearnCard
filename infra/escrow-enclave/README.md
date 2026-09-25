# infra/escrow-enclave

Terraform for the escrow-recovery Nitro Enclave stack: the **enclave-host**
EC2/ASG/NLB substrate (P3.1) plus its supporting KMS key, IAM roles, S3
buckets, and DynamoDB anti-replay ledger (P3.2). lca-api stays on Lambda;
this stack provisions everything the Lambda talks to over the private
network, plus the CMK that gates the enclave's escrow-key material.

## What this provisions

**Compute/network (P3.1):**

- Private-subnet `aws_launch_template` (AL2023, `enclave_options.enabled`,
  IMDSv2-only, encrypted EBS, no public IP, no SSH key) with user-data that
  installs `aws-nitro-enclaves-cli`, configures the allocator
  (`cpu_count`/`memory_mib`), configures a `vsock-proxy` allowlisted to KMS
  only, fetches the `.eif` from S3, and wires up (but does not start) a
  placeholder `escrow-enclave-host.service` for the P3.3 parent binary.
- `aws_autoscaling_group` (min 2, across the subnets you pass in) with
  `health_check_type = "ELB"` and a rolling `instance_refresh`.
- Internal `aws_lb` (Network Load Balancer, TCP :8443) + target group with a
  TCP health check on a **separate** port (:8444).
- One security group: ingress 8443 only from `lca_api_security_group_id`,
  ingress 8444 only from the VPC CIDR (NLB health-check source), egress 443
  (KMS/S3/DynamoDB) and UDP to the configured Roughtime ports.
- `aws_cloudwatch_log_group` at `/learncard/escrow-enclave-host/<environment>`,
  365-day retention.

**KMS / IAM / storage / ledger (P3.2):**

- `kms.tf` — the escrow CMK: symmetric, automatic key rotation, 30-day
  deletion window, alias `alias/learncard-escrow-enclave-<environment>`.
  Its key policy grants `kms:Decrypt` in one statement **per pinned
  measurement tuple** (`var.enclave_measurements`), each conditioned on
  `StringEqualsIgnoreCase kms:RecipientAttestation:PCR0/1/2` all matching
  simultaneously (decisions.md D7), plus a separate attestation-free
  `kms:Encrypt` statement for first-boot key sealing, a universal Deny of
  `kms:Decrypt` when no attestation is present at all, and a Deny of
  `kms:PutKeyPolicy` without an MFA-authenticated session. Administration
  (not Decrypt/Encrypt) is scoped to `var.kms_admin_role_arn` and a narrow
  root break-glass statement. **lca-api is never named anywhere in this
  policy.**
- `iam.tf` — the `enclave-host` EC2 role/instance profile (Decrypt/Encrypt
  on the escrow CMK, scoped S3/DynamoDB/Logs access, explicit Deny of
  `UpdateItem`/`DeleteItem` on the records ledger table, optional SSM core
  access) and the separate `escrow-ledger-monitor` role (read-only on both
  ledger tables + the records stream, read on the audit bucket, no
  escrow-CMK access at all).
- `storage.tf` — two S3 buckets encrypted with their own (non-escrow) CMK:
  `...-audit` (Object Lock COMPLIANCE mode, `var.audit_retention_days`
  default retention, audit-only) and `...-artifacts` (versioned, not
  locked, holds built `.eif` files). Both deny non-TLS requests.
- `ledger.tf` — DynamoDB `escrow-ledger-records-<environment>` (append-only
  chain records, PITR, stream `NEW_IMAGE`, deletion protection) and
  `escrow-ledger-heads-<environment>` (mutable head pointer, PITR, deletion
  protection). Implements decisions.md D3's option A — **detection** of
  ledger rollback, not prevention; see D3 and `ledger.tf`'s header comment.

## What this does NOT provision (P3.3, separate)

- The `escrow-enclave-host` parent binary itself (the placeholder systemd
  unit user-data installs has no `ExecStart` target until P3.3 ships it).
- The `escrow-kms-admin` IAM role/user — pass its ARN in via
  `kms_admin_role_arn`. Owned by a security-team-controlled process, not
  this module.
- The `escrow-ledger-monitor` Lambda **function** (P7.1) — this module only
  creates its IAM role (`monitor_role_arn` output) so kms.tf/storage.tf/
  ledger.tf have a stable principal to reference ahead of time.

## Inputs

See `variables.tf` for full descriptions/validation. Notable ones:

| Variable                | Notes                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instance_type`         | Default `m6i.xlarge`. Validation rejects `*.large` and smaller — a 2-vCPU instance cannot host a 2-vCPU enclave (decisions.md D1).                  |
| `private_subnet_ids`    | >= 2 required by variable validation; a `check` block (plan/apply only) also asserts they span >= 2 distinct AZs and have no public IP on launch.   |
| `enclave_measurements`  | 1–3 pinned `{label, pcr0, pcr1, pcr2}` tuples (each PCR = 96 hex chars). See `escrow-measurements.tfvars.example` and "Measurement rotation" below. |
| `kms_admin_role_arn`    | ARN of the `escrow-kms-admin` role, created **outside** this module. Never grant this to lca-api's role.                                            |
| `instance_profile_name` | Optional override (default `null`) — normally leave unset so `iam.tf`'s created profile is used.                                                    |
| `roughtime_servers`     | Defaults to Cloudflare + Google per decisions.md D2. Must have >= 2 entries.                                                                        |

## Apply procedure (manual/CI — not run by this task)

```bash
cd infra/escrow-enclave
terraform init \
  -backend-config="bucket=<state-bucket>" \
  -backend-config="key=escrow-enclave/<environment>/terraform.tfstate" \
  -backend-config="region=<region>" \
  -backend-config="dynamodb_table=<lock-table>"
terraform plan  -var-file=<environment>.tfvars
terraform apply -var-file=<environment>.tfvars
```

`terraform apply` and the resulting staging attestation check (confirming the
enclave-host actually serves a real Nitro attestation document, not the
software-mode stub) are **manual/CI verification steps** — this task does
not and cannot run them (no AWS credentials available in this environment,
and per the plan's Accept criteria for P3, that verification belongs to a
later step once P3.2/P3.3 exist to make the ASG's instances actually pass
their health check).

## Local verification (what this task DOES do)

No AWS credentials required:

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

## Measurement rotation (N / N+1)

Every enclave code change produces a new EIF with new PCR0/1/2 values, and
`var.enclave_measurements` is a **client-visible allowlist** (decisions.md
D7, plan §5 risks) — clients pin measurements too, so a rotation has to
overlap:

1. **Build N+1.** Run the P2 reproducible-build pipeline; confirm two
   independent builds produce the identical PCR0 before trusting the
   result.
2. **Add N+1 to the key policy first, without removing N.** Edit
   `enclave_measurements` to list both `{label: "N", ...}` and
   `{label: "N+1", ...}` (validation allows 1–3 entries specifically for
   this). This is a key-policy change — follow the two-person procedure
   below.
3. **Roll the ASG onto the N+1 image** (new `eif_s3_uri`/
   `enclave_image_version`, instance refresh). Instances now serve
   attestations for N+1; the key policy still accepts N in case any
   instance hasn't refreshed yet or a rollback is needed.
4. **Ship N+1's PCRs to clients** (tenant config / SDK release) so they
   start accepting the new measurement. Wait for adoption to be
   effectively complete — old clients pinned only to N would otherwise
   reject a healthy N+1 enclave's attestation.
5. **Remove N from `enclave_measurements`.** Only after every instance has
   rolled AND no client-side rollout still depends on N. This is again a
   key-policy change requiring the two-person procedure.

A third slot (N-1/N/N+1) exists only for the brief window where step 5
hasn't happened yet for a previous rotation while a new one starts —
collapse back to 1–2 entries as soon as practical; a stale, unused
measurement sitting in the key policy is a needless expansion of what
`kms:Decrypt` will accept.

## Two-person key-policy change procedure

Terraform and AWS IAM **cannot enforce** a true two-person approval by
themselves — `kms.tf`'s `DenyPutKeyPolicyWithoutMFA` statement only proves
that the one human who ran `terraform apply` had an MFA-authenticated
session. The second person is enforced entirely by process:

1. **Open a PR** changing `enclave_measurements`, `kms_admin_role_arn`, or
   any other input that changes `kms.tf`'s rendered policy. The diff must
   be reviewable directly in the PR (this is why the policy is built from
   `aws_iam_policy_document`, not an opaque `jsonencode` blob).
2. **CODEOWNERS-required security-team review and approval.** The security
   reviewer independently re-derives, from the diff, which principals gain
   or lose which actions — in particular confirming lca-api's role is
   still absent from every statement, and that any new/removed measurement
   tuple is legitimate (matches a signed, reproducibly-built EIF per P2).
3. **A second person, holding `escrow-kms-admin`, runs `terraform apply`
   from an MFA-authenticated session.** This person should not be the PR
   author. `kms:PutKeyPolicy` is denied outright without MFA present
   (`aws:MultiFactorAuthPresent`), so a non-MFA session cannot apply the
   change even if it merged.
4. **Record the change** (PR link, approver, applier, timestamp) in the
   ledger/ops runbook — key-policy changes are exactly the kind of event
   the audit trail this stack builds (`ledger.tf`, `storage.tf`'s audit
   bucket) should itself be able to answer "who changed the trust boundary
   and when" about, even though the policy change itself happens outside
   the ledger.

lca-api's execution role must never appear as a principal in any statement
`kms.tf` renders — that is the property both the reviewer in step 2 and the
`EscrowKmsAdminManagement`/`RootAccountBreakGlassAdministration` statements'
non-crypto action scoping (kms.tf's `local.kms_admin_actions`) exist to
protect end-to-end.

## Residual risk: key administrators

Plainly: an `escrow-kms-admin` holder with an MFA-authenticated session
**can** rewrite this key's policy (`kms:PutKeyPolicy` is denied only
_without_ MFA, not denied outright) to add a new, unconditioned
`kms:Decrypt` Allow statement — at that point the CMK's attestation gating
is gone. This is not a Terraform-enforceable boundary; it is a process
boundary, and no combination of `aws_iam_policy_document` statements in
this module can fully close it (a sufficiently-privileged admin can always
rewrite the policy that constrains their own privilege — this is true of
essentially any KMS key that anyone can administer at all, not specific to
this design).

Mitigations, layered (none of them eliminate the risk on their own):

- **CODEOWNERS-required security-team review** on every PR touching
  `enclave_measurements`, `kms_admin_role_arn`, or any other input that
  changes `kms.tf`'s rendered policy — see "Two-person key-policy change
  procedure" above. This is the intended primary control.
- **`DenyPutKeyPolicyWithoutMFA`** — raises the bar from "any admin
  session" to "an MFA-authenticated admin session", closing the most
  common accidental- or leaked-non-MFA-credential path. Does not stop a
  deliberate insider with a working MFA device.
- **CloudTrail alarm on `PutKeyPolicy`, `CreateGrant`, and
  `ScheduleKeyDeletion`** against this key, so a policy rewrite is
  detected even if it bypassed (or was never subject to) the PR review
  above. **Not implemented by this module** — TODO, tracked as P7.1
  (`escrow-ledger-monitor`'s alarm wiring; see
  `.sisyphus/plans/nitro-escrow-enclave.md`).

**Alternative not adopted here (requires explicit sign-off): an immutable
key policy.** Remove `kms:PutKeyPolicy` for every principal, including
`escrow-kms-admin` and root — this requires
`bypass_policy_lockout_safety_check = true` on `aws_kms_key.escrow` at
creation/update time, since AWS's normal safety check refuses to let a
policy update remove the caller's own ability to manage the key. Under
that model there is no living principal who can ever change the trust
boundary again — a measurement rotation (or any other policy change)
instead requires provisioning a **brand-new CMK** and re-sealing the
escrow private key to it (the enclave already regenerates/reseals this
material at boot per kms.tf's `AllowEncryptForBootSealing` statement, so
this is less disruptive than it sounds, but it does turn every rotation
into a new-key operation with its own alias cutover instead of an in-place
policy edit). Not adopted by default: it would make the N/N+1 rotation
procedure above materially more disruptive in exchange for closing a risk
the two-person procedure already substantially — not fully — mitigates.
It is the correct choice if a future security review judges
MFA-authenticated-admin-rewrite risk unacceptable even with two-person PR
review; that decision requires explicit sign-off, not a silent default.

See `.sisyphus/notepads/nitro-escrow-enclave/decisions.md` D10 for the
decision record.

## Records overwrite detection

`iam.tf` denies `dynamodb:UpdateItem`/`dynamodb:DeleteItem` on
`escrow-ledger-records`, but IAM has no equivalent of DynamoDB's
`ConditionExpression`: it cannot express "allow `PutItem` only if the item
doesn't already exist" (`attribute_not_exists`, decisions.md D3). A caller
that holds ordinary `dynamodb:PutItem` on this table — which the
enclave-host role must, to append new records at all — can silently
overwrite an existing record if the application-level condition
expression is ever missing, buggy, or bypassed. This is a real, currently
open gap that Terraform/IAM alone cannot close.

`ledger.tf` sets the records table's stream to `NEW_AND_OLD_IMAGES` (not
just `NEW_IMAGE`) specifically so this class of tampering is _detectable_
downstream: under correct operation, this table only ever sees `INSERT`
stream events (new appends) — `MODIFY` and `REMOVE` should never happen at
all, since `UPDATE`/`DELETE` are IAM-denied and every legitimate write is
a fresh `PutItem` with a unique `sk`. **The P7.1 escrow-ledger-monitor
Lambda MUST treat any `MODIFY` or `REMOVE` stream event on this table as
tampering and alarm immediately** — there is no legitimate code path that
produces either. This is not implemented by this module (P3.2 only
creates the table + stream); it is a hard requirement on the P7.1
implementation, not an optional enhancement.

## Operational notes

- **VPC endpoints recommended.** The security group's egress to 443 is
  `0.0.0.0/0` because this module doesn't assume Interface/Gateway VPC
  endpoints exist for KMS/S3/DynamoDB in the target VPC. P3.2 does not add
  them either (out of scope) — tightening egress to the endpoint's
  SG/prefix list remains a safe, independent follow-up.
- **Roughtime egress is inherently broad.** `roughtime.cloudflare.com` and
  `roughtime.sandbox.google.com` don't have stable IPs a security group can
  pin, so UDP egress to their ports is `0.0.0.0/0`. The enclave verifies each
  response's signature itself (decisions.md D2), so the relay path being
  network-open is an accepted, documented tradeoff, not an oversight.
- **The ASG will not pass its health check until P3.3 ships.** The
  `escrow-enclave-host.service` placeholder unit is enabled but not started
  by user-data (its `ExecStart` binary doesn't exist yet), so nothing listens
  on 8444 out of the box. That's expected for this infra-only change.
