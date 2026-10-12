# infra/escrow-enclave

## P7.1 monitor addition

`monitor.tf` now provisions the independent monitor Lambda, records-stream mapping,
15-minute full audit sweep, SQS failure queue, SNS/email notifications, integrity,
rate, delivery-health and heartbeat alarms, dashboard, and CloudTrail KMS-governance
EventBridge rule. This supersedes the historical P3.2 "monitor not implemented"
and CloudTrail TODO statements below. Supply `monitor_zip_path` (Linux x86_64
bootstrap ZIP), `monitor_tenant`, and `monitor_public_key_parameter_name`.
Provision the attestation-verified public key in a security-owned SSM String
parameter and enable an independent CloudTrail management-event trail first.
See [the monitor runbook](../../services/escrow-ledger-monitor/README.md) for
build, configuration, limitations, and the **manual-only** API release kill switch.

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
  only, fetches the `.eif` from S3, downloads and SHA-256-verifies the
  `services/escrow-enclave-host` parent binary, fetches its TLS
  certificate/key and bearer token from SSM Parameter Store, and installs +
  starts (`systemctl enable --now`) the real `escrow-enclave-host.service`.
- `aws_autoscaling_group` (min 2, across the subnets you pass in) with
  `health_check_type = "ELB"` and a rolling `instance_refresh`.
- Internal `aws_lb` (Network Load Balancer, TCP :8443) + target group with an
  HTTP health check (GET /health, matcher 200) on a **separate** port
  (:8444) — matching the plain-HTTP `/health` endpoint
  `services/escrow-enclave-host` actually serves.
- One security group: ingress 8443 only from `lca_api_security_group_id`,
  ingress 8444 only from the VPC CIDR (NLB health-check source), egress 443
  (KMS/S3/DynamoDB) and UDP to the configured Roughtime ports.
- `aws_cloudwatch_log_group` at `/learncard/escrow-enclave-host/<environment>`,
  365-day retention.

**KMS / IAM / storage / ledger (P3.2):**

- `kms.tf` — the escrow CMK: symmetric, automatic key rotation, 30-day
  deletion window, alias `alias/learncard-escrow-enclave-<environment>`.
  Its key policy grants `kms:Decrypt` AND `kms:GenerateDataKey` together in
  one statement **per pinned measurement tuple** (`var.enclave_measurements`),
  each conditioned on `StringEqualsIgnoreCase
kms:RecipientAttestation:PCR0/1/2` all matching simultaneously
  (decisions.md D7) plus the `escrow-enclave-key` encryption-context marker
  — first boot calls `GenerateDataKey` (with Recipient attestation) to mint
  a fresh, attested-only sealed key; every later boot calls `Decrypt` (also
  with Recipient) against that same ciphertext. `kms:Encrypt` is **never**
  granted to any principal, and is explicitly, unconditionally Denied
  (alongside `ReEncryptFrom`/`ReEncryptTo`/`GenerateDataKeyWithoutPlaintext`/
  `GenerateDataKeyPair(WithoutPlaintext)`) — see kms.tf's header comment for
  the full provenance model (C1 fix). The policy also carries a universal
  Deny of `Decrypt`/`GenerateDataKey` when no attestation is present at all,
  and a Deny of `kms:PutKeyPolicy` to the root user without MFA.
  Administration (not Decrypt/GenerateDataKey) is scoped to
  `var.kms_admin_role_arn` and a root-user break-glass statement. That
  statement is pinned with `aws:PrincipalArn` = root: a bare account-root
  principal delegates to every IAM admin in the account, so IAM identity
  policies grant nothing on this key.
  **lca-api is never named anywhere in this policy.** A Terraform native
  test (`tests/kms_key_policy.tftest.hcl`) asserts this contract offline —
  see "Testing the KMS key policy" below.
- `iam.tf` — the `enclave-host` EC2 role/instance profile (Decrypt +
  GenerateDataKey — never Encrypt — on the escrow CMK, scoped
  S3/DynamoDB/Logs/SSM access, explicit Deny of `UpdateItem`/`DeleteItem` on
  the records ledger table, optional SSM core access) and the separate
  `escrow-ledger-monitor` role (read-only on both ledger tables + the
  records stream, read on the audit bucket, no escrow-CMK access at all).
- `storage.tf` — two S3 buckets encrypted with their own (non-escrow) CMK:
  `...-audit` (Object Lock COMPLIANCE mode, `var.audit_retention_days`
  default retention, audit-only) and `...-artifacts` (versioned, not
  locked, holds built `.eif` files). Both deny non-TLS requests.
- `ledger.tf` — DynamoDB `escrow-ledger-records-<environment>` (append-only
  chain records, PITR, stream `NEW_IMAGE`, deletion protection) and
  `escrow-ledger-heads-<environment>` (mutable head pointer, PITR, deletion
  protection). Implements decisions.md D3's option A — **detection** of
  ledger rollback, not prevention; see D3 and `ledger.tf`'s header comment.

## What this does NOT provision

- Building the `escrow-enclave-host` parent binary or the enclave `.eif`
  themselves — this module only downloads, verifies, installs, and runs
  whatever object `host_binary_s3_uri`/`eif_s3_uri` point at. Producing
  those artifacts is the P2/P3.3 build pipelines' job, not Terraform's.
- The `escrow-kms-admin` IAM role/user — pass its ARN in via
  `kms_admin_role_arn`. Owned by a security-team-controlled process, not
  this module.
- The `escrow-ledger-monitor` Lambda **function** (P7.1) — this module only
  creates its IAM role (`monitor_role_arn` output) so kms.tf/storage.tf/
  ledger.tf have a stable principal to reference ahead of time.

## Inputs

See `variables.tf` for full descriptions/validation. Notable ones:

| Variable                                                                                                           | Notes                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instance_type`                                                                                                    | Default `m6i.xlarge`. Validation rejects `*.large` and smaller — a 2-vCPU instance cannot host a 2-vCPU enclave (decisions.md D1).                                                      |
| `private_subnet_ids`                                                                                               | >= 2 required by variable validation; a `check` block (plan/apply only) also asserts they span >= 2 distinct AZs and have no public IP on launch.                                       |
| `enclave_measurements`                                                                                             | 1–3 pinned `{label, pcr0, pcr1, pcr2}` tuples (each PCR = 96 hex chars). See `escrow-measurements.tfvars.example` and "Measurement rotation" below.                                     |
| `kms_admin_role_arn`                                                                                               | ARN of the `escrow-kms-admin` role, created **outside** this module. Never grant this to lca-api's role.                                                                                |
| `instance_profile_name`                                                                                            | Optional override (default `null`) — normally leave unset so `iam.tf`'s created profile is used.                                                                                        |
| `roughtime_servers`                                                                                                | Exactly the compiled IDs/endpoints: Cloudflare `:2003`, int08h `:2002`, Tanner Ryan `:2002`. Validation rejects drift; the enclave requires 2-of-3 and intersects every valid response. |
| `host_binary_s3_uri`                                                                                               | `s3://` URI of the built `escrow-enclave-host` parent binary, in the same artifacts bucket as `eif_s3_uri`.                                                                             |
| `host_binary_sha256`                                                                                               | Required 64-hex-char SHA-256 of `host_binary_s3_uri`. user-data verifies it and refuses to install/start the service on mismatch.                                                       |
| `escrow_key_id`                                                                                                    | Logical `ESCROW_KEY_ID` the host passes to the parent binary (decisions.md D18 — stable across measurement rotations).                                                                  |
| `escrow_previous_key_ids` / `escrow_previous_key_objects`                                                          | Up to 3 previous key IDs + their sealed-key S3 objects, paired by index, for P9.1 rotation/recovery. Both empty outside an active rotation.                                             |
| `escrow_allow_first_boot`                                                                                          | `true` only for the one boot that provisions the first sealed key; flip back to `false` and roll the ASG immediately after (see the variable's own description for why).                |
| `host_bearer_token_parameter_name` / `host_tls_certificate_parameter_name` / `host_tls_private_key_parameter_name` | Absolute SSM Parameter Store (SecureString) names for the host's bearer token and TLS cert/key. Provisioned outside this module; only read-only IAM access is granted here.             |

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
software-mode stub) are **manual/CI verification steps** — no AWS
credentials are available in this local-development/CI-lint context, and
real infrastructure verification belongs to a deploy pipeline, not this
repo checkout.

## Local verification (what this task DOES do)

No AWS credentials required:

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
terraform test
```

`terraform test` runs `tests/kms_key_policy.tftest.hcl` — see "Testing the
KMS key policy" below for how it exercises the real (unmocked) policy
computation entirely offline.

## Testing the KMS key policy

`tests/kms_key_policy.tftest.hcl` asserts, against the real rendered
`data.aws_iam_policy_document.escrow_kms_key_policy.json`, that:

- no `Allow` statement grants `kms:Encrypt`, `kms:ReEncryptFrom`,
  `kms:ReEncryptTo`, `kms:GenerateDataKeyWithoutPlaintext`,
  `kms:GenerateDataKeyPair`, or `kms:GenerateDataKeyPairWithoutPlaintext`;
- every `Allow` of `kms:Decrypt`/`kms:GenerateDataKey` carries
  `StringEqualsIgnoreCase` conditions on all three
  `kms:RecipientAttestation:PCR0/1/2` variables, plus the
  `escrow-enclave-key` encryption-context marker;
- there is exactly one such `Allow` per pinned measurement tuple;
- explicit `Deny` statements exist for every prohibited action, for the
  no-attestation-present case, and for both debug-mode-PCR cases (all
  covering `GenerateDataKey` as well as `Decrypt`); and
- `kms:CreateGrant` is still unconditionally denied.

This intentionally does **not** use a single `mock_provider "aws" {}`:
`aws_iam_policy_document`'s `json` output is pure local computation (no AWS
API call ever), but a full mock replaces it with a random placeholder
string like every other provider resource, which would make the test
assert against garbage rather than the real policy. Instead, the test file
declares a real (unmocked) `aws` provider with fake static credentials and
`skip_*` flags (so `terraform test` never needs real AWS access to
"configure" it), and uses `override_data`/`override_resource` on every
OTHER resource/data source in this module that would otherwise make a real
AWS call — S3, DynamoDB, the escrow/S3 KMS keys themselves, Lambda, the
NLB/ASG, CloudWatch, SNS/SQS, and the account/VPC/AMI lookups. Every
`aws_iam_policy_document` data source (and `aws_partition`, confirmed to
need no API call) is deliberately left un-overridden so it computes its
real JSON. The run uses `command = apply`, not `plan`: the policy's
principal (`aws_iam_role.enclave_host.arn`) is a managed-resource attribute
that Terraform always defers reading dependent data sources against until
apply time, regardless of mocking; overriding that one role gives it a
concrete (fake, but known) arn once applied, which is what lets the real
policy document resolve to a known JSON string instead of staying unknown.
No resource is ever really created in AWS — every managed resource is
overridden, so `apply` never reaches a real provider call.

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
   author. The role can only be assumed by a listed IAM user with a fresh
   MFA code (`infra/escrow-enclave-bootstrap/mfa-session.sh`); IAM Identity
   Center (SSO) sessions hold no key-policy grant. The key policy itself
   denies `kms:PutKeyPolicy` to the root user without MFA. It cannot do the
   same for the role: role sessions report `aws:MultiFactorAuthPresent` as
   false even when assumed with MFA, so an all-principal MFA deny would lock
   the key and KMS's lockout safety check rejects it.
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
  `services/escrow-enclave-app/SECURITY.md#design-decisions`).

**Alternative not adopted here (requires explicit sign-off): an immutable
key policy.** Remove `kms:PutKeyPolicy` for every principal, including
`escrow-kms-admin` and root — this requires
`bypass_policy_lockout_safety_check = true` on `aws_kms_key.escrow` at
creation/update time, since AWS's normal safety check refuses to let a
policy update remove the caller's own ability to manage the key. Under
that model there is no living principal who can ever change the trust
boundary again — a measurement rotation (or any other policy change)
instead requires provisioning a **brand-new CMK** and re-sealing the
escrow private key to it (the enclave already re-seals this material via
attested `kms:GenerateDataKey` on first boot against whichever CMK it is
pointed at, per kms.tf's per-measurement Allow statement, so
this is less disruptive than it sounds, but it does turn every rotation
into a new-key operation with its own alias cutover instead of an in-place
policy edit). Not adopted by default: it would make the N/N+1 rotation
procedure above materially more disruptive in exchange for closing a risk
the two-person procedure already substantially — not fully — mitigates.
It is the correct choice if a future security review judges
MFA-authenticated-admin-rewrite risk unacceptable even with two-person PR
review; that decision requires explicit sign-off, not a silent default.

See [Design Decisions](../../services/escrow-enclave-app/SECURITY.md#design-decisions)
D10 for the decision record.

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
- **Roughtime egress is inherently broad.** `roughtime.cloudflare.com`,
  `roughtime.int08h.com` and `time.txryan.com` use DNS rather than IPs this module can
  pin, so UDP egress to their ports is `0.0.0.0/0`. The enclave verifies each
  response's signature itself (decisions.md D2), so the relay path being
  network-open is an accepted, documented tradeoff, not an oversight.
  UDP rules are deduplicated to ports 2002/2003. User-data supplies the exact
  `cloudflare`/`int08h`/`txryan` ID map, preserving JSON quotes in systemd.
  Pins/protocols are compiled into the measured enclave, never host-supplied.
  One unavailable source is tolerated; two or any valid disagreement fail closed.
  int08h and Tanner were live-verified on 2026-09-30; Cloudflare timed out locally.
  Confirm staging reachability and obtain Tanner's requested approval for
  high-volume infrastructure before launch. Public services have no uptime SLA.
- **First boot requires `escrow_allow_first_boot = true`.** Every other boot
  should run with it `false` — see that variable's description for why
  leaving it `true` is dangerous after the first sealed key exists.
- **Secrets never touch Terraform state or the repo.** `host_bearer_token_parameter_name`/
  `host_tls_certificate_parameter_name`/`host_tls_private_key_parameter_name`
  are SSM parameter _names_ only; user-data fetches their values at boot
  with `--with-decryption` and writes them straight to root-only
  (0600) local files, never through a Terraform resource.
