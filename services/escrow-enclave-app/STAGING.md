# Staging bring-up and verification runbook

This is the operational runbook for standing up the Nitro escrow enclave stack in staging and
verifying it end-to-end. It complements `README.md` (threat model, wire contract, local
development) and `../../infra/escrow-enclave/README.md` (Terraform reference) — it does not repeat
either in full.

> **PR 2 and PR 3 are both implemented offline, not deployed or approved for
> production release.** Configured enrollment authority resolves the old
> enrollment blocker under its stated IAM/SCP trust assumptions. PR 3's
> enclave-sent recovery email confirmation resolves attack C under its own
> stated SES/credential-delivery assumptions — see the dedicated cutover
> section below, which runs **after** the PR 2 cutover completes (email
> confirmation is layered on an already-configured authority). Roughtime
> operations and privileged-administrator risks still require review.
> For this cutover, use the ordered sections below before the older bring-up notes.

## CloudTrail trail and alarm drills — operator only

**Nothing is applied by this PR.** The operator's 2026-10-20 read-only inspection
found no account/shadow/organization trail for staging. Event history contained
36 PutKeyPolicy calls in 90 days, but kms-governance and all six authority-* rules
had zero TriggeredRules in 60 days. Governance alarms were **inert**, not quiet
evidence of safety. The bootstrap trail fixes the missing source after deployment;
the following drills are required before relying on that mitigation.

Apply order for the **existing staging account**, from the repository root:

1. Pause recovery using the existing release kill switch and coordinate with
   security/on-call. Inventory the actual core `authority_generation`, region,
   backend and existing inputs; do not invent a new generation for this update.
   In the ignored bootstrap tfvars add `authority_generations = ["<LIVE_GENERATION>"]`
   (include every retained/overlapping generation). All ARNs are computed from
   that list, region and the caller account; no dependency on core state exists.
   Default `cloudtrail_retention_days = 365` is shared by staging and production.
   An explicitly reviewed shorter staging override is allowed for **new** log
   objects only; COMPLIANCE retention on existing versions cannot be shortened.
2. Obtain a fresh MFA `escrow-kms-admin-session` with the existing helper. Run
   bootstrap using that profile, **not SSO/OrganizationAccountAccessRole**: only
   the MFA role can administer the new log key. Review the proposed changes and
   require second-person approval before confirming each apply:

    ```sh
    bash infra/escrow-enclave-bootstrap/mfa-session.sh '<TOTP>'
    AWS_PROFILE=escrow-kms-admin-session terraform -chdir=infra/escrow-enclave-bootstrap init \
      -backend-config=backend-staging.hcl
    AWS_PROFILE=escrow-kms-admin-session terraform -chdir=infra/escrow-enclave-bootstrap apply \
      -var-file=staging.tfvars
    ```

    Use the approved local tfvars path if the operator keeps it elsewhere. This
    creates the multi-region trail, dedicated log bucket, COMPLIANCE retention,
    versioning/public block/TLS/delete protections and dedicated KMS key. No
    lifecycle expiry is configured; retention is a minimum, not automatic deletion.
    For a brand-new account, first create/enroll bootstrap MFA users/role using the
    resource-only procedure in [PRODUCTION.md](PRODUCTION.md), then apply the trail
    as that role; do not disable the KMS lockout safety check.

3. From **management-account security credentials**, initialize the separate
   guardrail root against its existing security-owned backend and apply its
   existing ignored inputs (`enable_enrollment_authority=true`, member account,
   exact MFA users, environment). Do not use the member-account profile here:

    ```sh
    AWS_PROFILE='<MANAGEMENT_SECURITY_PROFILE>' terraform -chdir=infra/escrow-enclave-bootstrap/authority-guardrail init \
      -backend-config='<ABSOLUTE_GUARDRAIL_BACKEND_FILE>'
    AWS_PROFILE='<MANAGEMENT_SECURITY_PROFILE>' terraform -chdir=infra/escrow-enclave-bootstrap/authority-guardrail apply \
      -var-file='<ABSOLUTE_GUARDRAIL_TFVARS>'
    ```

    Independently verify **both** attached SCP contents. The existing second policy
    now denies trail stop/delete/update/selector changes and bucket policy,
    lifecycle, Object Lock, versioning, encryption and replication changes except
    the existing MFA-admin ARN. No per-request MFA condition or extra attachment
    is introduced. Management-account administrators remain trusted.

4. Verify logging **before core**. With the escrow MFA profile and actual region:

    ```sh
    aws cloudtrail get-trail-status --profile escrow-kms-admin-session \
      --name escrow-enclave-staging-audit --region '<REGION>'
    aws cloudtrail get-event-selectors --profile escrow-kms-admin-session \
      --trail-name escrow-enclave-staging-audit --region '<REGION>'
    aws s3api get-object-lock-configuration --profile escrow-kms-admin-session \
      --bucket '<BOOTSTRAP_CLOUDTRAIL_BUCKET>'
    ```

    Require `IsLogging=true`, recent delivery, no delivery/digest errors, management
    reads **and** writes without KMS exclusion, and exact expected authority table
    ARNs with `readOnly=false`. Confirm delivered object versions have the expected
    retention and logs can be decrypted by the MFA admin. Restrict access to raw
    CloudTrail records: they can contain sensitive request metadata.

5. Refresh MFA as needed and apply **core**, retaining all existing approved
   image/PCR/credential settings and `enable_enrollment_authority=true`. Do not
   reset authority state or provision credentials for this monitoring-only change:

    ```sh
    AWS_PROFILE=escrow-kms-admin-session terraform -chdir=infra/escrow-enclave init \
      -backend-config='<ABSOLUTE_CORE_BACKEND_FILE>'
    AWS_PROFILE=escrow-kms-admin-session terraform -chdir=infra/escrow-enclave apply \
      -var-file='<ABSOLUTE_CORE_TFVARS>'
    ```

    Confirm the monitor SNS subscription (not only bootstrap's separate alarm
    topic), the new targets and DLQ authorization. Tamper monitoring is always on;
    authority-write rules are gated by `enable_enrollment_authority`. Direct
    EventBridge → SNS delivery does not depend on monitor Lambda/CloudWatch metrics.

**Required alarm drills (retain timestamps, event IDs, page receipts and latency):**

- With a known nonwriter **SSO** role, attempt one standalone write against a
  disposable, non-user key in the actual authority table. First have security
  verify the effective SCP/resource denies; never use a real enrollment key:

    ```sh
    aws dynamodb put-item --profile '<ESCROW_SSO_PROFILE>' --region '<REGION>' \
      --table-name 'escrow-enclave-staging-authority-<LIVE_GENERATION>' \
      --item '{"pk":{"S":"ALARM-DRILL"},"sk":{"S":"DENIED-WRITE"}}' \
      --condition-expression 'attribute_not_exists(pk)'
    ```

    Expect **AccessDenied**, no mutation, and both
    `AuthorityGovernance:unexpected_write` and `AuthorityGovernance:denied_write`
    on monitor SNS. Success is a security incident, not permission to clean up
    through an unreviewed bypass. If denied but no page arrives, inspect the locked
    CloudTrail record's `resources`, `readOnly`, `userIdentity`, and `errorCode`,
    EventBridge matches/failed invocations, subscription and DLQ. **Do not accept
    the mitigation until the real event shape and end-to-end delivery are proved.**

- During the next reviewed image roll, the normal MFA-admin `PutKeyPolicy` on
  the escrow CMK must trigger `EscrowKmsGovernanceChange`. Do not weaken the key
  policy just to test the alarm. Retain that page alongside the image-roll approval.
- With security approval, an SSO `StopLogging` attempt on the exact trail must
  be denied and trigger `EscrowCloudTrailTamper`; immediately verify logging is
  still on. Never run this drill as the excepted MFA admin. Also verify a normal
  successful enclave transaction is logged but does not produce a nonwriter alert.

The trail is multi-region; EventBridge rules are regional. These new rules cover
the home-region trail/log bucket and authority table. Existing forwarding covers
IAM/root/sign-in events from us-east-1. Other-region API attempts remain in the
trail but are not claimed to page without additional regional forwarding.
CloudTrail/EventBridge delivery is best effort; an administrator disabling the
detector can suppress the very tamper event. Monitor logging/delivery independently
and retain explicit security acceptance of R-AUTHORITY-ROLLBACK. Locked API logs
are not the deferred signed-authority archiver, required before 50% rollout.

## PR 2 authority cutover — operator only

None of these AWS commands/applies, credential provisioning, resets or deployments
were run by the implementation task. Use a scheduled **staging-only** maintenance
window, two-person security review, the dedicated member account and reviewed
operator credentials. Confirm account/region/tenant/database before each change.
Keep `ESCROW_RELEASE_KILL_SWITCH=true`, automatic enrollment rollout disabled, and
old clients out of the test cohort until the final gate. Do not edit a live
authority generation in place or weaken the escrow CMK policy.

Execute in this order:

1. **SCP apply and independent verification.** From management-account credentials,
   apply the separate `infra/escrow-enclave-bootstrap/authority-guardrail` root with
   the exact member account and bootstrap MFA-user list. Both outputs are required:
   `authority_guardrail_policy_id` and `authority_monitor_guardrail_policy_id`.
   The monitor-protection attachment is installed before the reader exception is
   added to the primary guardrail. Verify **both contents and both attachments**,
   effective inherited SCPs, policy-count quotas, account membership (not management),
   and MFA admin trust. Receipt strings alone prove nothing. The observer exception
   must be the exact `escrow-enclave-<environment>-ledger-monitor-role`, with only
   GetItem/Query/Scan; host/org-admin/root are not reader exceptions. Verify protection
   of monitor PassRole/IAM, Lambda updates and its fixed SSM trust path. Retain evidence
   from independent CloudTrail/security monitoring. IAM adversarial checks are a live
   operator gate, not what Terraform's mocked tests prove.

2. **Provision credential targets, then credentials.** Pick a new reviewed generation
   for this first disposable-staging cutover. Resources must exist before keys can
   be provisioned: enable the core stack's **resource** switch
   `enable_enrollment_authority=true` with `authority_tenant`, `authority_generation`
   and both verified SCP IDs, but keep `enable_credential_delivery=false`. This is
   not runtime activation: do not install authority settings in the running EIF yet.
   Keep `enable_enclave_email=false` and `create_sending_zone=false` (PR 3). The new
   table must be empty, encrypted, deletion-protected, PITR-enabled, without TTL.
   From the MFA admin session, use the existing provisioner:

    ```sh
    set +x
    eval "$(aws configure export-credentials --profile escrow-kms-admin-session --format env)"
    bash infra/escrow-enclave-bootstrap/provision-enclave-credentials.sh \
      --purpose authority-writer --environment staging --tenant '<tenant>' \
      --generation '<new-generation>' --bucket '<artifacts-bucket>' \
      --kms-key-arn '<credential-cmk-arn>' --escrow-kms-key-arn '<escrow-cmk-arn>'
    ```

    Run from the repository root on a trusted workstation without tracing/core dumps.
    The script prints only the ciphertext URI; never put plaintext keys into tfvars,
    Terraform state, shell history or a ticket. Verify create-only ciphertext at
    `credentials/authority-writer/<generation>`. Do not overwrite a slot. Investigate
    ambiguous provisioning and revoke orphan access keys before retrying. Provision
    no email-sender credentials for PR 2. Resource creation necessarily precedes this
    command; the runtime enablement steps are still below.

3. **Prepare enable flags and public measured configuration.** Use the Terraform
   outputs to set the complete `ESCROW_AUTHORITY_*` group and
   `ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN` in the measured build environment. Match tenant,
   generation, table ARN, writer ARN, region/account and the distinct credential
   CMK. No defaults from Mongo, legacy ledger or host environment may select scope.
   Verify that authority startup requires the owner verifier. Preserve steady-state
   `ESCROW_ALLOW_FIRST_BOOT=false`; a new authority generation is **not** permission
   to regenerate an escrow key. Keep email flags off and current lca-api notifications.

4. **Stage the delivery flag.** Set `enable_credential_delivery=true` in the pending,
   reviewed deployment inputs only after ciphertext existence/permissions are
   verified. It enables the host's opaque ciphertext read and boot delivery, not
   access to plaintext credentials. Do not roll an old host/EIF with this change
   alone: apply the pending flag together with the compatible artifacts in step 5.

5. **Build the new EIF, rotate measurements, deploy backend and observer.** Build
   twice using the reproducible pipeline; compare PCRs and verify the signed manifest
   includes all public authority settings. Approve complete PCR0/1/2 tuples for both
   escrow and credential CMKs through the existing two-person procedure—never add
   unattested Decrypt/Encrypt. Deploy the compatible host binary and EIF together,
   with the staged delivery flag, then verify fresh nonce-bound real NSM evidence,
   writer unsealing, DynamoDB TLS relay and fail-closed missing/partial configuration.
   Independently verify the attested ledger public key and
   `SHA-256(PCR0_bytes || PCR1_bytes || PCR2_bytes)`. Populate the security-owned SSM
   **String** at `/escrow-enclave-staging/authority-monitor-trust`:

    ```json
    {
        "<keyId>": {
            "publicKey": "<130 lowercase hex SEC1 characters>",
            "measurements": ["<64 lowercase hex measurement hash>"]
        }
    }
    ```

    Retain historical key/measurement pairs needed by immutable execution rows.
    The parser permits up to 32 keys, eight measurements per key and 8192 bytes
    (use an Advanced String if over the Standard limit). Never use fixture roots/keys.
    Deploy/recycle the new monitor after provisioning/updating this parameter: trust
    is loaded at cold start. Verify its fixed table/generation environment, read-only
    grant and successful `AuthoritySweepCompleted`; the legacy heartbeat is insufficient.
    A missing trust parameter during resource-only provisioning can legitimately
    alarm—do not mistake maintenance suppression for a passed gate. Rehearse invalid
    signature/missing receipt/coverage alarms on disposable test data and verify the
    independent notification channel. Monitor must have no authority writes or
    escrow/credential-CMK grants. Lca-api must run the new signed wire/API version.

6. **Reset disposable staging data, not trusted history.** Archive the prior staging
   evidence under security access controls. With traffic paused, use an explicit,
   reviewed list of staging test identities: clear their Mongo `escrowBlob`,
   `escrowPin` and escrow recovery-method entries, and remove/archive their old hold
   rows (including unconfirmable legacy cancellation markers). Preserve account
   auth shares, contact identities, other recovery methods and opt-out preferences
   unless the test owner explicitly opts in. Do not import Mongo epochs, PIN counters
   or parent-ledger history. The new authority starts empty. Do not truncate/restore
   an existing authority table in its generation; later generation cutovers require
   a separately reviewed retention/parallel-resource procedure, not a blind Terraform
   replacement of a deletion-protected table. Users with the account key re-enroll
   through signed intent; do not manufacture enrollment for a lost-key account.

7. **Roll out clients last, then run the gates.** Publish matching tenant measurement
   pins and the authority-aware SDK/AuthCoordinator build to the staging cohort.
   Keep automatic enrollment off for old clients: the new API rejects unsigned
   remote enrollment/disablement and old clients fail closed. Enable the new client
   cohort only after backend/EIF/observer readiness; check fresh Snapshot nonces,
   signed enroll/carry/PIN set/change/clear/disable, returned persisted ciphertext,
   restart/cancellation races, disabled-state preservation and rewrap reconciliation.
   Verify software mode cannot substitute for Nitro. Remove obsolete PCR allowance
   only after the overlap and client rollout are complete; keep verification-only
   monitor anchors for historical records. Release the API maintenance switch only
   for the approved staging rehearsal and perform the real seven-day soak. This
   does **not** authorize a production launch while attack C/PR 3 remains open.

Rollback means disabling traffic and investigating, not restoring older authority
rows or deploying an unsigned client/API path. Committed releases cannot be revoked
retroactively. The API kill switch is operational defense, not protection from a
host that bypasses that API; credential revocation/approved-image removal require
the security incident process.

## PR 3 attack-C email cutover — operator only

None of these AWS commands/applies, credential provisioning, DNS delegation or
deployments were run by the implementation task. Run this **after** the PR 2
authority cutover above has completed through at least step 5 (backend/EIF/
observer deployed with authority configured) — email confirmation only applies
to Hold-policy holds under an already-configured authority. Use the same
staging-only maintenance window, two-person security review and reviewed
operator credentials. Keep `ESCROW_RELEASE_KILL_SWITCH=true` until the final gate.

Execute in this order:

1. **Choose and register the sending domain.** Pick a dedicated subdomain —
   staging convention is `staging.notify.learncard.com` — never reuse a
   production-facing domain for test sends. Set `sending_domain` in the pending
   Terraform inputs. If the parent zone is owned by a different account/root
   module, set `create_sending_zone=true` and delegate the returned
   `sending_zone_name_servers` NS records from the parent zone's owning account;
   otherwise set it `false` and publish the `sending_dns_records` output
   (identity verification TXT, three DKIM CNAMEs, `bounce.<domain>` MX/SPF)
   yourself. Verify the SES domain identity and all three DKIM tokens show
   **Verified** in the SES console before proceeding — an unverified identity
   fails every send closed, which is correct behavior, not a bug to route around.

2. **Request SES production access.** New SES accounts/identities start in the
   sandbox (send only to verified addresses, low rate). File the AWS production-access
   request (describe the use case: transactional account-recovery codes, low
   volume, existing bounce/complaint handling via the configuration set this
   stack creates) well before the staging cohort needs to receive real codes —
   approval can take hours to days. Confirm the sandbox has actually been lifted
   (send a test message to an address you do **not** control pre-verify) before
   relying on it for the e2e gate in step 6.

3. **Provision the email-sender credential.** From the MFA admin session, same
   provisioner as PR 2's authority-writer credential, with the distinct purpose:

    ```sh
    set +x
    eval "$(aws configure export-credentials --profile escrow-kms-admin-session --format env)"
    bash infra/escrow-enclave-bootstrap/provision-enclave-credentials.sh \
      --purpose email-sender --environment staging --tenant '<tenant>' \
      --generation '<same-generation-as-authority>' --bucket '<artifacts-bucket>' \
      --kms-key-arn '<credential-cmk-arn>' --escrow-kms-key-arn '<escrow-cmk-arn>'
    ```

    Verify create-only ciphertext at `credentials/email-sender/<generation>`,
    distinct from `credentials/authority-writer/<generation>`. The IAM user this
    mints can only `ses:SendEmail` from the exact `recovery@<sending_domain>`
    identity/configuration-set pair — confirm this scoping in the IAM console,
    not just by reading the Terraform source, before trusting it with real mail.

4. **Enable the resource and delivery flags together.** Unlike PR 2's authority
   flag (which can be staged resource-first with delivery held back), email has
   no equivalent two-step: set `enable_enclave_email=true` in the pending,
   reviewed deployment inputs alongside `enable_credential_delivery=true` (if
   not already `true` from the PR 2 cutover) and the new EIF/host binary pair
   that include the email vsock-proxy relay (port 8002,
   `email.<region>.amazonaws.com`) and the `ESCROW_EMAIL_CREDENTIAL_OBJECT`
   environment wiring. Build/compare/deploy exactly as PR 2 step 5 describes.
   After boot, verify in the enclave-host's own logs (fixed labels only, never
   secrets) that `install_service_hosts` and the email vsock-proxy unit both
   started — a missing `/etc/hosts` entry or proxy unit means every send will
   fail closed with no indication beyond that fixed label.

5. **Verify fail-closed behavior before trusting any send.** With a disposable
   test identity, enroll with recovery email/language bound into the blob (the
   client UI step from sub-item (e)), confirm the SES domain is verified and
   production access is live, then deliberately break one precondition at a
   time (e.g., temporarily revoke the email-sender IAM policy) and confirm
   `start-recovery` for a Hold-policy hold fails closed rather than silently
   falling back to the old unconfirmed path. Restore the precondition before
   continuing.

6. **Run the real end-to-end flow.** Using a disposable staging test identity
   with a real, access-controlled inbox:
    - Start a Hold-policy recovery; confirm the app shows the code-entry step
      (`requiresConfirmation: true` in the `startRecovery` response) and an
      email with the 8-digit code arrives within a few seconds, in the
      account's selected language, with the "only enter this code if you
      started this recovery" line and no links.
    - Enter the code in the app; confirm the "recovery started" email arrives
      and the app's countdown begins.
    - Deliberately enter a wrong code once first — confirm it's rejected with
      a friendly error and the correct code still works afterward (the guess
      budget is per-code-lifetime, not per-attempt).
    - Exercise resend: confirm the old code stops working and the new one in
      the resend email works.
    - Let (or force, via the reminders job's own `now` override if testing
      off a short `ESCROW_HOLD_DURATION_MS`) the hourly reminder job run past
      the warning window; confirm the "release in ~24 hours" email arrives
      and lca-api's own reminder notification does **not** also fire for this
      hold (see `AUDIT-COVERAGE.md`'s attack-C row for the offline test this
      mirrors — this step is the live confirmation that the same suppression
      holds against real SES/Postmark, not just the offline fakes).
    - After the full wait, confirm release succeeds and the share is returned.
    - Cancel a separate hold from each of `AwaitingConfirmation` and `Pending`
      and confirm both succeed.

7. **Confirm bounce/complaint handling.** Send to a known SES bounce simulator
   address (`bounce@simulator.amazonses.com`) and confirm the configuration
   set's SNS event destination delivers to the existing monitor topic. Do not
   skip this — a sending domain with silently accumulating bounces/complaints
   risks SES throttling or suspending the identity during real incidents.

Rollback is two separate levers, not one Terraform flag flip — **verify both in
staging before relying on either in an incident.**

**Pause first (reversible in minutes, no enclave change).** `enable_enclave_email`
is measured boot configuration baked into the EIF (`EmailConfig::from_measured_env`,
read by `nitro.rs` ~263-275), not a runtime toggle the already-running host polls.
Flipping it to `false` in Terraform alone tears down the sender/SES/
credential-delivery resources and proxy wiring out from under a still-deployed,
email-measured EIF; that EIF's own boot config still expects
`email_credential_ciphertext`, so its **next boot fails closed** instead of
quietly falling back to the old unconfirmed path. To pause attack-C email
confirmation without touching the enclave, set lca-api's
`ESCROW_RELEASE_KILL_SWITCH=true` (cancellation and reminders keep working), or,
only if the enclave must not be called at all, unset `ESCROW_ENCLAVE_MODE`
(blocks every escrow operation including cancellation). Neither needs a
Terraform apply or new artifact; see the table below for exact effects.

**Full rollback (requires a new, coordinated build).** Reverting the enclave
itself means deploying a previous, compatible **EIF, its own measurements, and
the matching `enable_enclave_email`/`enable_credential_delivery` Terraform flags,
all together** — build the prior commit, diff/verify its PCRs, and roll host +
EIF + `enclave_measurements` as one change, exactly like any other measurement
rotation (see "2. Measurements" above). Never flip `enable_enclave_email` in
Terraform and leave the previously-deployed, email-measured EIF running — see
the boot-time failure above. This must preserve the authority ledger/DynamoDB
history untouched; do not truncate or reset it (same rule as the PR 2 rollback
note earlier in this document). Never reuse a burned sending domain or
re-provision over an existing credential slot as part of a rollback — treat it
as its own reviewed generation/path, same as any other credential rotation.

**Existing holds: behaviour differs per lever.** The three states below are
not interchangeable; pick the lever whose effect you actually want.

| Operation                                | Full pause (`ESCROW_ENCLAVE_MODE` unset)                 | Release kill switch (`ESCROW_RELEASE_KILL_SWITCH=true`) | Service enabled, email-disabled compatible EIF |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| Start recovery (`startRecovery`)         | Blocked (`PRECONDITION_FAILED`)                          | Blocked                                                 | Hold-policy start fails closed (no sender)     |
| Confirm code (`confirmRecovery`)         | Blocked                                                  | Blocked                                                 | Works with an already-received code            |
| Resend code (`resendRecoveryCode`)       | Blocked                                                  | Blocked                                                 | Fails closed (`unavailable`)                   |
| Cancel (`cancelRecovery` / cancel link)  | **Blocked**                                              | Works                                                   | Works                                          |
| Reminders job (warnings, cancel retries) | **Stopped** (still alarms on cancellations near release) | Runs                                                    | Runs; warnings fail closed (`unavailable`)     |
| Complete / release (`completeRecovery`)  | Blocked                                                  | Blocked                                                 | Only holds already warned 24h earlier          |

- **Full pause** blocks every escrow procedure in the route middleware
  (`routes/index.ts`, covered by the disabled-mode test in
  `test/keys-escrow.spec.ts`) and the reminders job exits early, so users
  cannot cancel either. Use it only when the enclave path itself must not be
  called at all; prefer the kill switch otherwise.
- **Release kill switch** is the default incident lever: it stops new
  recoveries, confirmation, resends and release, while cancellation and the
  reminders job (warning sends and cancellation retries) keep running. Warnings
  sent while it is on still count toward the 24-hour requirement once it is
  lifted.
- **Email-disabled compatible EIF** (after a full rollback): confirmation and
  cancellation need no email; new Hold-policy holds, resends and release
  warnings fail closed. A `pending` hold not yet warned **cannot release** until
  email (resources and a matching measured image) is restored on the same
  authority generation; it stalls rather than losing its history.

Verify each column in staging before relying on it.

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
eifSha256, nitroCliVersion, nitroCliContainerImage}`) as a workflow artifact, plus commits it to
   `security/` on tag. The `eif` job runs on a plain GitHub-hosted runner (`ubuntu-latest`) — no
   self-hosted Nitro-capable runner to provision — because `nitro-cli build-enclave` needs no real
   Nitro hardware; `nitro-cli` runs containerized against a pinned Amazon Linux 2023 image (see
   `scripts/nitro-cli-container.sh` and `README.md` "Reproducible build" for the full explanation).
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

**Before the very first boot, confirm the sealed-key IAM permission actually exists.** The
enclave-host role needs `s3:PutObject` on the exact `ESCROW_SEALED_KEY_OBJECT` path
(`infra/escrow-enclave/iam.tf`'s `WriteSealedKey` statement, scoped to the `sealed-keys/` prefix
only — `ESCROW_SEALED_KEY_OBJECT` MUST live under that prefix or the host's own startup validation
refuses to boot, per `services/escrow-enclave-host/README.md`). Don't assume `terraform apply`
succeeding proves this: verify with a real write **as the enclave-host role**, e.g.

```sh
aws s3api put-object --bucket <artifacts-bucket> --key sealed-keys/.permission-check \
  --body /dev/null --if-none-match "*"
aws s3api delete-object --bucket <artifacts-bucket> --key sealed-keys/.permission-check
```

A missing or misscoped `WriteSealedKey` statement, or a bucket-policy Deny that doesn't correctly
exempt conditional writes, would otherwise only surface as an opaque `AccessDenied` on the host's
real first boot.

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

`WriteSealedKey` is only granted while `escrow_allow_first_boot = true`, so the permission check
above applies to the first-boot apply only; a steady-state host role has no PutObject on
`sealed-keys/`.

## 4a. First staging bring-up: procedure and lessons (2026-10-02)

The first real bring-up (account `217358003896`) followed this order. Each step was a separate,
reviewed apply.

1. **Bootstrap and network stacks** (`infra/escrow-enclave-bootstrap`, `infra/escrow-enclave-network`).
2. **Stage 1, targeted** (`-target` on the CMKs, buckets, tables and host role) with placeholder
   all-`ff` measurements. The EIF cannot be built before the CMK exists because the CMK ARN is
   measured into it. A full apply at this point would create the ASG against placeholder artifacts.
3. **Artifacts.** EIF from CI; host binary and monitor zip built in the pinned
   `amazonlinux:2023` image for `linux/amd64` (glibc 2.34). Every upload uses
   `put-object --if-none-match '*'` and is read back to compare the SHA-256.
4. **TLS and secrets.** A staging CA name-constrained to `escrow-enclave.staging.internal` (so
   trusting it via `NODE_EXTRA_CA_CERTS` cannot vouch for any other host), plus SSM
   `bearer-token`, `tls-cert`, `tls-key`. The CA key is kept in SSM (`ca-key`), which the host role
   cannot read.
5. **Full apply with the first-boot EIF** and `escrow_allow_first_boot = true`.
6. **Ledger trust anchor.** Call `/v1/attest` with a fresh nonce, verify it with
   `scripts/verify-attestation.py`, and write the printed key to
   `/learncard/escrow-enclave/<env>/ledger-public-key` as `{"<keyId>":"<130 hex>"}`. Never take
   this key from an unverified response.
7. **Steady state.** Build the EIF again with `ESCROW_ALLOW_FIRST_BOOT=false` (the
   `escrow-staging` environment variable), add its PCRs as a second measurement, set
   `escrow_allow_first_boot = false`, roll, and confirm CloudTrail shows one recipient
   `Decrypt` and no `GenerateDataKey`, the sealed-key object still has one version, and a fresh
   attestation gives the same ledger key. Then remove the first-boot measurement.

Operational notes:

- **Credentials.** Terraform cannot use `aws login` sessions directly; export them first with
  `eval "$(aws configure export-credentials --format env)"`. Key-policy changes need the MFA
  admin session from `infra/escrow-enclave-bootstrap/mfa-session.sh <TOTP>` (profile
  `escrow-kms-admin-session`, one hour). Check `aws sts get-caller-identity` before every write;
  SSO sign-ins can land in a different account.
- **Debug mode cannot test boot.** A `--debug-mode` enclave reports all-zero PCRs, so the app
  correctly refuses at the `nsm_measurement` step before reaching KMS. Production enclaves have no
  console; instead the enclave sends the first failing startup step to the host, which logs
  `enclave_boot_failed step=<label>` to its journal.
- **Loopback starts down** inside the enclave. The KMS forwarder brings `lo` up before binding
  `127.0.0.1:8000`.
- **KMS `CiphertextForRecipient` is BER** (indefinite lengths, sometimes chunked
  `encryptedContent`), not DER. `kms/ber.rs` normalises it before the strict CMS checks.
- **Authority-foundations builds:** KMS boot/unsealing now queries the existing
  Roughtime relay before every AWS request, failing closed if verified time is
  unavailable. Check relay port 5001 as well as the KMS byte proxy when diagnosing
  `kms_unseal_or_generate`/`kms_unseal_previous` failures. TLS roots are compiled
  `webpki-roots`, not `SSL_CERT_FILE`; root updates require a new measured image.
  This does not enable enrollment or email, and the delayed-delivery time caveat
  in SECURITY.md still applies. Live staging verification remains outstanding.
- **Time quorum is a boot and rollback check.** From this build on, boot cannot
  unseal the escrow key without a Roughtime quorum: 2 of the 3 pinned servers
  (`roughtime.cloudflare.com:2003`, `roughtime.int08h.com:2002`,
  `time.txryan.com:2002`) must answer with authenticated, overlapping times via
  the host relay on vsock 5001. Include it in every roll, forward **or back**:
    1. Before rolling, on a machine whose UDP egress matches the host's, run
       `cargo test --lib time::live_tests -- --ignored --nocapture` in this crate and
       confirm at least two servers verify. One failure is tolerated; two is a stop.
    2. After boot, confirm the host journal has no `enclave_boot_failed` line and
       CloudTrail shows the expected attested `Decrypt`. A `kms_unseal_or_generate` /
       `kms_unseal_previous` failure with KMS reachable usually means no quorum: check
       relay port 5001 and UDP egress to the three servers.
    3. Rolling back to another image built from this branch or later does **not**
       bypass a time outage: it needs the same quorum to boot. Only an image from
       before authority foundations boots without it, and that image must still be
       in the KMS measurement list.
- **Configured authority / deferred email clients:** `build-eif.sh` forwards optional measured settings:
  `ESCROW_AUTHORITY_{REGION,ACCOUNT_ID,TABLE,WRITER_USER,TENANT,ENVIRONMENT,GENERATION}`
  and `ESCROW_EMAIL_{REGION,ACCOUNT_ID,SENDER_USER,FROM,IDENTITY,CONFIGURATION_SET}`.
  Leave each entire group unset until the ordered cutover is approved;
  partial groups are rejected by the config loader. These settings contain names,
  never access keys. Configured boot consumes authority settings and reserves
  ports 8001 (regional DynamoDB) and 8002 (regional SES); the gated host proxy
  services/allowlists are provisioned only by the explicit authority/email flags,
  not active in current staging.
- **Gated credential delivery:** additionally measure
  `ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN` for a separate credential CMK (never
  the escrow CMK). After installing the Organizations guardrail and provisioning,
  the host
  can read `ESCROW_AUTHORITY_CREDENTIAL_OBJECT=credentials/authority-writer/<generation>`
  and `ESCROW_EMAIL_CREDENTIAL_OBJECT=credentials/email-sender/<generation>` from
  the artifacts bucket. Unset paths add no reads or boot-response fields; configured
  missing/oversized objects fail closed, even with first-boot generation enabled.
  Objects must contain only KMS ciphertext. The operator-only
  `infra/escrow-enclave-bootstrap/provision-enclave-credentials.sh` performs the
  create/encrypt/create-only-upload flow; do not supply dedicated plaintext keys
  to the host. See the infrastructure README for the MFA session and failure
  cleanup procedure. `enable_credential_delivery` is a separate, default-false
  second phase, enabled only after ciphertext upload and paired host/EIF readiness.
  Rotation must use an approved new generation/path with continuity review, not
  overwrite an existing object or roll back authority state.
- **Measurement provenance:** `build-eif.sh` records all fourteen public authority/
  email settings under `measurements.json.config.authority` and `.email`. The CI
  workflow forwards the same environment vars to both reproducibility builds,
  preserves that config in `escrow-measurements.json`, and includes it in signed
  `manifest.json` alongside the artifact hashes. Empty values remain empty; these
  fields are not runtime activation flags or proof that the new configuration
  has passed the runtime loader's validation.

    **Infrastructure gate:** keep `enable_enrollment_authority=false` and
    `enable_enclave_email=false` in current staging. Enabling requires the separate
    two management-account SCPs and reviewed generation/tenant. Email remains PR 3; for its later cutover, explicitly
    set `sending_domain=staging.notify.learncard.com`; optional `create_sending_zone`
    creates only that child zone and outputs NS for delegation from the separately
    owned `notify.learncard.com` parent. Otherwise publish the record outputs in the
    external DNS account. No parent zone/DMARC is managed. Verify SES production-send
    access, bounce/complaint SNS, denied org-admin key/table operations, credential-CMK
    attestation enforcement, and relay TLS before any later activation. No staging
    Terraform plan/apply or AWS adversarial checks were run for this checkpoint.

- **Diagnosing boot without a console.** CloudTrail on the escrow CMK (`GenerateDataKey` /
  `Decrypt` from the host role, with `recipient` in `additionalEventData`) shows whether the
  enclave reached KMS; `strace` on the host process shows whether it connected to vsock 5001/5002.
  Suspend `ReplaceUnhealthy` and `HealthCheck` on the ASG while debugging so the host is not
  replaced underneath you, and resume them afterwards.
- **Monitor.** Until the ledger key parameter exists the monitor exits at cold start and its
  scheduled sweeps land in the DLQ. Purge the DLQ once the parameter is in place and a manual
  sweep succeeds.

## 5. Non-root `/dev/nsm` access

**Verified on 2026-10-02:** the enclave process runs as `USER 65532:65532` and `/dev/nsm`
attestation and vsock both work under that UID on a real Nitro host (first boot sealed the key and
`/v1/attest` returned a valid NSM document). No `USER 0:0` fallback is needed.

## 6. Run the e2e spec against staging

> Complete the PR 2 cutover gates first and use authority-aware clients. Unconfigured
> enrollment and insufficient trusted-time evidence still fail closed. Passing an
> older legacy smoke script is not proof of the new authority lifecycle; use the
> coverage inventory and updated client flows, then perform the real elapsed soak.

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
Roughtime and Enrollment are resolved:

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

## 11. Key Rotation Rehearsal

Before performing a key rotation in production, rehearse it on staging:

1. Follow the [Key Rotation Procedure](./SECURITY.md#key-rotation-procedure) to generate a new key and configure the old one as previous.
2. Confirm a PIN survives adding a recovery method (the carry-on-enroll path).
3. Run the rewrap job (`bun scripts/escrow-blob-mode-report.ts` then trigger the job).
4. Confirm the report drains (0 copies under the old key).

## Open launch blockers

These are launch-blocking, not "nice to have later" — call them out explicitly whenever staging
verification is attempted, don't bury them in a footnote.

### Authenticated EnrollmentSource (implemented; operational gates remain)

Configured boot now wires the DynamoDB authority and owner verifier. Unconfigured
mode still uses `UnavailableEnrollment`. Both guardrails, provisioning, native
relay/boot verification, client rollout and independent monitor checks above are
required before staging release rehearsal. Attack C/email confirmation remains a
separate PR 3 launch blocker; PR 2 does not mitigate suppressed lca-api notifications.

### Second production-grade Roughtime source (blocks steps 6 and 7)

The enclave's 7-day hold requires **at least 2 independent, overlapping signed time sources**
(D2/D3) and fails closed otherwise. The enclave pins three public servers
(Cloudflare, int08h, txryan) and require 2, so staging can complete releases while two answer.
None of the three offers a production uptime guarantee (Cloudflare's documentation says "DO NOT
USE IN PRODUCTION"), so losing two of them blocks boot and every release with
`InsufficientSources`. A production decision is still needed:

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

**Confirmed gap, code fix awaiting deployment:** the rules existed but were inert
without an enabled CloudTrail trail, as verified on 2026-10-20. Apply bootstrap's
trail, updated guardrails and core monitoring, then complete the
[CloudTrail drills](#cloudtrail-trail-and-alarm-drills--operator-only). Do not
describe D10 as mitigated merely because Terraform contains an EventBridge rule.

The alternative of an **immutable key policy** (`bypass_policy_lockout_safety_check = true`, no
principal — including root — retains `kms:PutKeyPolicy`) was considered and rejected for now: it
would close this risk entirely, but makes every future measurement rotation require provisioning a
brand-new CMK and re-sealing the escrow private key to it, instead of an in-place policy edit — a
materially more disruptive rotation procedure. Revisit only as an explicit, signed-off decision if
a future security review judges the residual risk unacceptable even with two-person review.
