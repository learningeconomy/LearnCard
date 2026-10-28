# Production infrastructure bootstrap

Operator runbook, not launch approval. Follow [STAGING.md](./STAGING.md)'s
resource → credentials → measured image → monitor → clients order and retain
two-person evidence for every trust change. Commands below are **operator-only**;
no AWS operation is performed by preparing these files. Run from the repository
root unless stated otherwise; replace every `<PLACEHOLDER>` first.

**Pre-50% gate: the authority Object Lock archiver/outbox is deferred, not a launch
blocker.** It must be implemented, tested, independently monitored and
security-approved before stage 4 (50%), or sooner if security rejects
R-AUTHORITY-ROLLBACK. Earlier stages require explicit acceptance of that residual
risk and verified CloudTrail data-write/governance alarms; the legacy ledger audit
bucket and authority sweep are not independent archived authority history. Close the live
authority/email, Roughtime operations, seven-day soak and residual administrator
risk gates in [SECURITY.md](./SECURITY.md) and [ROLLOUT.md](./ROLLOUT.md).
Keep automatic rollout at zero and `ESCROW_RELEASE_KILL_SWITCH=true` throughout.
This does not disable manual enrollment: keep client mode `off` until approved.

Proposed design and closure evidence: [AUTHORITY-ARCHIVER.md](AUTHORITY-ARCHIVER.md).

## Sending domain decision

The decided SES sending domain is **`vault.notify.learncard.com`**, delegated by NS from the existing
`notify.learncard.com` zone in the WeLibrary account to a child zone in the new
production escrow account. Staging's `staging.notify.learncard.com` delegation
stays untouched. Obtain the parent zone/account identifiers from the operator
inventory; do not copy staging identifiers into production inputs.

- Delegation isolates DNS administration, DKIM, MAIL FROM and DMARC from other
  notification services; it costs a hosted zone and a one-time parent NS change.
  Subdomains still share organizational-domain reputation; this is not complete
  deliverability isolation.
- Do not send directly from `notify.learncard.com`, create a second undelegated
  parent zone, or replace existing parent DMARC/SPF records. Production uses
  `create_sending_zone=true` and delegates the child zone, just like staging.
- [email.tf](../../infra/escrow-enclave/email.tf) creates SES identity, three DKIM
  CNAMEs, verification TXT, `bounce.<domain>` MX/SPF, TLS-required configuration
  set and bounce/complaint SNS delivery. MAIL FROM failure is `RejectMessage`.
  The sender is exactly `recovery@<domain>`. DMARC defaults to `p=none`; review
  alignment/reports before promoting `email_dmarc_policy` to `quarantine`/`reject`.
  Configure an actual report mailbox (and external-report authorization if needed).
  Terraform manages only the selected sending domain, not the parent DMARC policy.

Launch approval must explicitly cover ScoutPass/VetPass mail coming from this
LearnCard address, including rendered brand names (VetPass currently falls back
to the tenant label). Domain selection is not approval of cross-brand copy;
retain product/security sign-off and sample messages before enabling either tenant.

## Ordered bootstrap and verification

### 1. [operator] New member account and guardrail preparation

Use the **existing production member account** in the organization; the existing
staging escrow account is not production. Confirm it is in the security-reviewed escrow
OU, review effective/inherited SCPs and policy attachment quotas, prepare the
bootstrap-owned escrow-account CloudTrail trail, and establish break-glass ownership.
Prepare the [authority guardrail root](../../infra/escrow-enclave-bootstrap/authority-guardrail/README.md)
with explicit `environment=production`, the new member account and the exact
bootstrap MFA human-user ARNs. Its default environment is staging: override it.
Attach the two authority SCPs after bootstrap creates those users/role, **before
any authority or dedicated credentials exist**. Management-account SCP operations
and member-account Terraform operations use distinct sessions/state.

Verification (management session, then member session respectively):

```sh
aws organizations list-parents --child-id '<ACCOUNT_ID>'
aws organizations list-policies-for-target --target-id '<ACCOUNT_ID>' --filter SERVICE_CONTROL_POLICY
aws sts get-caller-identity
```

Inspect inherited OU/root policies too; attachment IDs alone are not proof of
policy contents. Confirm the account is not the organization management account.

### 2. [terraform] State bucket and bootstrap

Copy both `production.tfvars.example` files to ignored `production.tfvars` files
and replace placeholders locally. Both modules ignore `*.tfvars`, retaining
`*.tfvars.example`. Backend files deliberately contain `<ACCOUNT_ID>`; override
the bucket on init instead of checking real account IDs into these examples.

The bootstrap root **creates its own state bucket**. For this first deployment,
use a trusted disposable copy of that root with its empty `backend "s3" {}` block
temporarily omitted, initialize local state and first create the state bucket and
MFA role/users using a reviewed resource-only target set. Enroll MFA, assume
`escrow-kms-admin`, then review/apply the full bootstrap (including CloudTrail)
there. The dedicated log key intentionally grants no key administration to the
initial organization-admin session; do not bypass KMS's lockout safety check.
Protect that state. Restore the backend block in the same copy, then migrate its
state to the newly created bucket; do not initialize an empty remote state and
recreate resources. The core root can then initialize directly against S3.

```sh
# In the bootstrap copy, AFTER its initial local apply and backend restoration:
terraform init -migrate-state -backend-config=backend-production.hcl \
  -backend-config='bucket=learncard-escrow-tfstate-production-<ACCOUNT_ID>'
terraform state list
aws s3api get-bucket-versioning --bucket 'learncard-escrow-tfstate-production-<ACCOUNT_ID>'
aws s3api get-bucket-encryption --bucket 'learncard-escrow-tfstate-production-<ACCOUNT_ID>'
aws s3api get-public-access-block --bucket 'learncard-escrow-tfstate-production-<ACCOUNT_ID>'
```

Require versioning, KMS encryption, TLS-only policy, public-access blocking and
native S3 lockfile permissions. Use Terraform >= 1.10. Preserve the bootstrap
and core's distinct state keys. Enroll both operators' MFA, confirm SNS
subscriptions, apply both prepared SCPs and independently inspect their contents
and attachments (`aws organizations describe-policy --policy-id '<SCP_ID>'`).

Set bootstrap `authority_generations` to every live/retained core
`authority_generation` before applying; table ARNs are computed without reading
core state. Add future generations to bootstrap **before** creating their tables.
The multi-region trail logs all management reads/writes (including KMS) and all
authority-table write data events, including batch, transaction and PartiQL writes.
Its dedicated same-account bucket uses versioning, COMPLIANCE Object Lock and a
dedicated KMS key. Default retention is **365 days** in both environments; staging
may explicitly choose a shorter `cloudtrail_retention_days` before delivery, never
shorten existing locked versions. There is no automatic log expiry.

**Fixed gap, pending deployment:** operator read-only findings on 2026-10-20 showed
no escrow staging account or organization trail (only a management-account-only
trail). CloudTrail history had **36 PutKeyPolicy events in 90 days**, but
`TriggeredRules = 0` over 60 days for kms-governance and all six authority-* rules.
The governance alarms were inert without an enabled trail. This change supplies
the missing trail; merge/offline tests do not prove the gap is fixed in AWS.

Before core provisioning, verify from the escrow MFA session:

```sh
aws cloudtrail get-trail-status --name escrow-enclave-production-audit --region '<REGION>'
aws cloudtrail get-event-selectors --trail-name escrow-enclave-production-audit --region '<REGION>'
```

Require `IsLogging=true`, recent successful delivery, no delivery/digest errors,
and exact intended table ARNs. After core installs the monitor rules/subscription,
run [the staging alarm drills](STAGING.md#cloudtrail-trail-and-alarm-drills--operator-only)
in production with approved disposable data: an SSO authority write must be denied
and page; the next reviewed image-roll `PutKeyPolicy` must trigger
`EscrowKmsGovernanceChange`. Keep recovery paused until delivery is demonstrated.

### 3. [terraform] Network, authority table and CMKs before compute

Provision/review the production network separately (see
[network module](../../infra/escrow-enclave-network/README.md)). Use two private
subnets in distinct AZs, NAT/endpoints for required AWS access and Roughtime UDP.
Initialize the core production backend. Follow staging's reviewed **resource-only
targeted bootstrap**: create CMKs, buckets, tables, IAM principals and SES resources,
not an ASG using placeholder artifacts. The EIF needs the CMK ARN baked in, so a
first full apply cannot resolve this dependency safely. The operator must review
the target set and dependencies; no persistent `-target` deployment workflow.

Replace example PCR placeholders with a reviewed, non-debug bootstrap sentinel
tuple only for this resource phase; never run hosts or trust that sentinel in
clients. Set authority/email resources on, both verified SCP receipts, explicit
tenant/generation, and **delivery off**. This creates the credential targets before
provisioning; the matching image and full compute rollout happen below.

Use `mfa-session.sh '<TOTP>' '<ACCOUNT_ID>' '<IAM_USER>'` with the production
source profile configured locally; never rely on its staging account/user defaults.
It uses fixed source/target profile names; check the resulting caller before every
write. SCPs block SSO from protected IAM user reads, SES administration and
monitor/authority changes: use the MFA role, not an SSO retry or weakened SCP.

```sh
aws sts get-caller-identity --profile escrow-kms-admin-session
aws dynamodb describe-table --table-name '<AUTHORITY_TABLE>'
aws dynamodb describe-continuous-backups --table-name '<AUTHORITY_TABLE>'
aws dynamodb describe-time-to-live --table-name '<AUTHORITY_TABLE>'
aws kms get-key-policy --key-id '<ESCROW_CMK_ARN>' --policy-name default
aws kms get-key-policy --key-id '<CREDENTIAL_CMK_ARN>' --policy-name default
```

Require deletion protection, PITR, no TTL, an empty **new** authority generation,
and a separate credential CMK. Never restore/truncate an existing generation.

### 4. [operator] SES delegation and production access

Read `sending_zone_name_servers` and `sending_dns_records` from core outputs.
Delegate only `vault.notify.learncard.com` from WeLibrary. Verify all generated
records and SES identity/DKIM/custom MAIL FROM in the production account/region.
Request SES production access for transactional account-recovery codes, documenting
expected volume and bounce/complaint handling. Domain verification alone does not
remove the sandbox. Confirm SNS subscriptions and restrict recipient metadata access.

```sh
dig +short NS vault.notify.learncard.com
dig +short TXT _amazonses.vault.notify.learncard.com
dig +short MX bounce.vault.notify.learncard.com
dig +short TXT _dmarc.vault.notify.learncard.com
aws sesv2 get-email-identity --email-identity vault.notify.learncard.com
aws sesv2 get-account
```

Require `ProductionAccessEnabled`, verified sending/DKIM, successful MAIL FROM,
and a controlled send to a non-preverified recipient. Confirm bounce/complaint
delivery before relying on it. Warm up sending volume before launch. The launch
record must name a deliverability owner and a calendar date for promotion to
`quarantine`/`reject` after clean aggregate reports; an unset date blocks launch.
Any delay requires a new dated security approval, not indefinite `p=none`.

### 5. [operator] Seal writer and email credentials under MFA

With resources present, use a trusted workstation without shell tracing/core
dumps. Export the production MFA role session and provision each purpose once:

```sh
set +x
eval "$(aws configure export-credentials --profile escrow-kms-admin-session --format env)"
aws sts get-caller-identity
for purpose in authority-writer email-sender; do
  bash infra/escrow-enclave-bootstrap/provision-enclave-credentials.sh \
    --purpose "$purpose" --environment production --tenant '<TENANT>' \
    --generation '<GENERATION>' --bucket '<ARTIFACTS_BUCKET>' \
    --kms-key-arn '<CREDENTIAL_CMK_ARN>' --escrow-kms-key-arn '<ESCROW_CMK_ARN>'
  aws s3api head-object --bucket '<ARTIFACTS_BUCKET>' --key "credentials/$purpose/<GENERATION>"
done
```

Never put plaintext keys in tfvars, state, logs, tickets or host environment.
Both ciphertext slots are create-only. Investigate ambiguous provisioning and
revoke orphan keys; never overwrite a slot. Leave delivery off until the compatible
host/EIF rollout. Provision TLS certificate/key and bearer-token SecureStrings
separately; only parameter names enter Terraform. Scope the CA to the production
internal hostname; do not reuse staging tokens, certificates or CA keys.

### 6. [operator] Configure the GitHub production gate and artifact publisher

Create **`escrow-production`** (build/sign only) and
**`escrow-production-publish`** (verified upload only) before dispatching:

- On **both** environments: required independent reviewers, prevent self-review and disable administrator
  protection bypass. Permit only branch `main` and tags `escrow-enclave-v*` using
  selected deployment branch/tag rules. Protect both main and release-tag creation.
  Do not permit the staging development branch `escrow-recovery/nitro-enclave`.
- In the build environment, set the complete public `ESCROW_*` measured variables listed in the workflow,
  using production Terraform outputs: tenant/key/region/escrow CMK, previous key
  IDs, first-boot flag, authority region/account/table/writer/tenant/environment/
  generation/credential CMK, and email region/account/sender/from/identity/config set.
  `ESCROW_AUTHORITY_ENVIRONMENT` must be `production`; no access keys in these vars.
- In the publish environment only, set `ESCROW_KMS_REGION` (storage region),
  `ESCROW_ACCOUNT_ID`, `ESCROW_PUBLISH_ROLE_ARN`, `ESCROW_ARTIFACTS_BUCKET`,
  `ESCROW_ARTIFACTS_KMS_KEY_ARN` (the **storage** CMK, not either enclave CMK).
- After the core storage resources exist and **both environment protections and
  the account-wide isolation gate below are independently verified**, set bootstrap `enable_github_publisher=true`
  and `publisher_storage_kms_key_arn` to the **storage** CMK ARN. Set
  `github_oidc_provider_arn` if the account already has GitHub's OIDC provider;
  otherwise leave it null to create the provider. Review/apply bootstrap under MFA.
  Copy output `github_publisher_role_arn` to `ESCROW_PUBLISH_ROLE_ARN`; copy the
  same storage CMK ARN to `ESCROW_ARTIFACTS_KMS_KEY_ARN`. The bucket variable is
  `learncard-escrow-enclave-production-<ACCOUNT_ID>-artifacts`. No remote-state
  coupling or competing bucket-policy ownership is introduced.
- The role trusts only `token.actions.githubusercontent.com`, audience
  `sts.amazonaws.com`, exact subject
  `repo:learningeconomy/LearnCard:environment:escrow-production-publish`, with a one-hour
  maximum session. IAM allows PutObject only with `s3:if-none-match = *` and
  explicitly denies missing/nonmatching headers. GetObject (also HeadObject) is
  limited to `eif/*`. No list, delete, IAM, Terraform, authority/monitor, sealed-key
  or credential-object permissions are granted. Write-once is enforced for this
  publisher, not against administrators deleting/replacing objects independently.
  IAM administration (including modification of its own trust/permissions) and
  STS role chaining are explicitly denied, even if another policy grants them.
- SSE-KMS requires `kms:GenerateDataKey` for upload and **`kms:Decrypt` for the
  byte-for-byte GET readback**; `kms:Encrypt` is not needed. Both grants name only
  the storage CMK and require regional S3 plus the artifact object encryption
  context (or bucket ARN for S3 Bucket Keys). Null omits all KMS grants for an
  SSE-S3 bucket, but the current core bucket/workflow require SSE-KMS. Never pass
  the escrow/credential CMK. The core storage key delegates use to IAM, so its
  policy needs no publisher change (it reserves only `PutKeyPolicy`,
  `ScheduleKeyDeletion`, `DisableKey` and `DisableKeyRotation` for
  `escrow-kms-admin` and MFA root). Bucket-Key context is bucket-wide, while S3 access
  remains prefix-restricted.
- Both authority-guardrail SCPs were inspected: neither denies these object/KMS
  operations; bucket reconfiguration, authority and monitor takeover remain
  protected, and the publisher is not added to any exception. It has no KMS-policy
  grant. Independently check inherited SCPs and live enforcement before dispatch.

```sh
gh api 'repos/<OWNER>/<REPO>/environments/escrow-production'
gh api 'repos/<OWNER>/<REPO>/environments/escrow-production/deployment-branch-policies'
gh api 'repos/<OWNER>/<REPO>/environments/escrow-production-publish'
gh api 'repos/<OWNER>/<REPO>/environments/escrow-production-publish/deployment-branch-policies'
gh workflow run escrow-enclave-eif.yml --ref main -f deployment=production
```

**Account-wide isolation gate:** security must inventory **every role trust policy**
in the production member account (including wildcard/federated principals) and
confirm this publisher is the **only** role assumable through GitHub's provider.
Remove other GitHub trust before enabling publishing; retain the inventory and
independent approval, and monitor subsequent trust/provider changes through the
independent CloudTrail trail. These Terraform roots cannot prove the absence of
out-of-band roles. Do not grant GitHub any bootstrap/admin role, or approve another
workflow's use of the publish environment. Protect this workflow with required
security review; environment reviewers must inspect workflow/ref and artifact
evidence before approving the separate upload job. Test build-token rejection and
publish-token success before enabling uploads; never retain raw tokens as evidence.
Every production build job first attempts `AssumeRoleWithWebIdentity` on
`ESCROW_PUBLISH_ROLE_ARN` with its own token and fails unless AWS returns
`AccessDenied`. STS also denies nonexistent roles, so the publish job asserts the
build checked the exact role it then assumes; its successful assumption is the
success half (CloudTrail evidence). Set `ESCROW_PUBLISH_ROLE_ARN` in **both**
production environments.

**Claim compatibility:** AWS does not expose arbitrary GitHub JWT claims as IAM
condition keys; `token.actions.githubusercontent.com:job_workflow_ref` and
`:repository_id` conditions would fail closed, not add working isolation.
Moreover, `job_workflow_ref` is for reusable workflows, not this ordinary workflow.
See [GitHub's supported approach](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-with-reusable-workflows).
Workflow/numeric-ID binding would require a reviewed custom `sub` template (and
reusable-workflow extraction for `job_workflow_ref`), coordinated with **all**
repository OIDC consumers; do not silently change it and break staging.
Public identity inventory: repository `486055750`, owner `95718578`; these IDs
are not enforced by the default subject. A separate publishing account with
explicit cross-account artifact/storage-key grants is a future security option,
not created here and not a substitute for separating build/publish subjects.

The explicit production dispatch builds twice under production variables, signs
the same manifest format, verifies Sigstore identity/issuer and SHA-256 digests,
then publishes using `--if-none-match '*'` and byte-compares readback. Objects live
under `eif/<run-id>/<run-attempt>/`; partial failures require a new attempt, never
an overwrite. Download and retain the signed production measurement evidence for
two-person review. Production deliberately does not open the staging measurement
PR: its account/CMK configuration and PCRs are different. Before changing production
trust, attach the verified manifest, Sigstore bundle, measurements, run/attempt and
commit to the production trust-change review; record the independent approver and
MFA applier. Artifact publication alone is not approval to deploy or trust a tuple.

**Baseline discrepancy:** this branch contains no staging S3 publisher or explicit
staging ref gate. Its existing staging build/artifact/tag-PR behavior is unchanged;
the production publisher is new, not a promotion of staging's measured image.

**Break-glass manual publication:** if automation is unavailable, two operators
must verify the same signed manifest, exact workflow/ref, run/commit and file
digests on a trusted workstation before using an approved MFA publishing session.
Reuse the workflow's `put-object --if-none-match '*'` with the storage CMK and
byte-for-byte GET/readback comparison for all four files under a fresh
`eif/<run-id>/<run-attempt>/` prefix. Record approver, operator, reason and object
versions in the trust-change review; never delete/overwrite a partial upload,
relax bucket policy, or treat publication as permission to deploy.

### 7. [terraform] First image, then steady-state image roll

Replace the bootstrap sentinel with verified complete PCR0/1/2 tuples in **both**
CMK policies; never split them into independently combinable PCR lists. At most
**three tuples** are allowed; host count does not consume tuple slots. Review the
signed config as well as digests. Supply the verified host binary and Linux monitor
ZIP separately. Enable credential delivery together with the matching image.

For first boot only, keep all client traffic paused (client mode off and no
production API access to the NLB) through steps 7–9; the release kill switch alone
does not block enrollment. Both host input and measured image use first-boot=true.
Confirm the create-only sealed object exists and independently verify fresh,
nonce-bound Nitro attestation using [the staging verification procedure](./STAGING.md).
Then build first-boot=false (new PCRs), add that tuple **before** rolling, set the
host flag false and perform the full reviewed deployment. Production uses >=2
hosts, >=2 AZs, numeric launch-template versions and MinHealthy=100/MaxHealthy=200.
Ensure quota/subnet capacity for surge; Terraform does not wait for refresh completion.

```sh
aws autoscaling describe-instance-refreshes --auto-scaling-group-name escrow-enclave-production-asg
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names escrow-enclave-production-asg
aws elbv2 describe-target-health --target-group-arn '<TARGET_GROUP_ARN>'
aws s3api list-object-versions --bucket '<ARTIFACTS_BUCKET>' --prefix 'sealed-keys/<KEY_ID>'
```

Require >=2 healthy hosts across AZs, the same attested escrow/ledger public keys,
one sealed-key version and attested Decrypt (no new GenerateDataKey) in independent
CloudTrail evidence. The traffic-paused bootstrap order above is **not** the order
for a later live image roll. The ASG in `compute.tf` is attached directly to the
NLB target group: healthy N+1 hosts receive traffic during refresh, not only after
it finishes. KMS overlap does not make clients pinned only to N accept N+1.

For each later same-key image roll, use two separately reviewed deployment phases
(additive preparation, then image roll), retaining staging's add-before-roll and
remove-after-verification discipline:

1. Verify N+1's signed build/config/PCR evidence and retain N. Publish complete
   N/N+1 tuples in the **resolved tenant** `auth.sss.escrowEnclaveMeasurements`
   delivered to clients. Complete web cache/config adoption and any required native
   app/baked-config rollout; confirm supported clients actually resolve both tuples,
   not just that a source JSON changed. Append N+1's measurement hash under the
   existing attestation-verified ledger key in
   `/escrow-enclave-production/authority-monitor-trust`, preserving historical
   pairs; recycle monitor execution environments and confirm the new trust is
   loaded and a sweep succeeds (step 8). Record both client and monitor evidence
   **before any N+1 host can receive live NLB traffic**. If adoption cannot be
   confirmed, stop or use an explicitly approved maintenance gate that blocks all
   escrow traffic, including enrollment; the release kill switch is insufficient.
2. Add N+1's complete tuple to **both** CMK policies without removing N. Keep all
   live launch-template/image inputs at N during this preparation phase. Boot and
   freshly attest a candidate outside the live ASG/target group, checking N+1's
   PCRs and the same escrow/ledger keys before admitting it to live traffic. A key
   change requires a separate key-rotation procedure, not assumed same-key trust.
3. Only after those gates pass, update the image/launch template and run the
   new-host-first refresh. Wait for completion and verify fresh attestation through
   the production path, >=2 healthy hosts across AZs, unchanged sealed-key/key
   identity, attested Decrypt evidence and successful monitor coverage.
4. Remove N from both KMS policies only after all hosts and client rollouts have
   moved and the approved rollback window has closed. Retire obsolete client pins
   through the reviewed config rollout. **Never remove historical verification
   anchors from monitor trust.**

#### Deliberate host AMI updates

Production requires `host_ami_id` (a regional `ami-` plus 17 hex digits); there is
no production SSM latest lookup. Before first compute, independently verify Amazon
ownership, AL2023/x86_64 compatibility, availability in the deployment region and
patch provenance. Record the exact ID in ignored production inputs and the approved
change record. Staging defaults to null and retains its existing latest lookup.

Treat every AMI update as a two-phase change, not incidental maintenance:

1. **Prepare:** retain live AMI N and all live image/template inputs. Review N+1's
   provenance and patch changes, boot an isolated candidate outside the live
   ASG/target group with the existing EIF, then verify Nitro/relay/TLS operation,
   fresh attestation, unchanged keys/PCRs and monitor coverage. If the EIF changes,
   complete the client/monitor/KMS overlap procedure above before admission.
2. **Roll:** separately approve changing only `host_ami_id` to N+1, retain N for
   rollback, and perform the numeric-template 100/200 refresh. Wait for completion,
   healthy capacity across AZs and fresh production-path attestation/monitor checks
   before closing the rollback window. A rollback is another reviewed pin change.

AMI pinning does not pin the packages installed by user-data; package repository
drift remains a separate hardening item, not a claim of immutable host builds.

### 8. [operator] Monitor trust, alarms and production PrivateLink

Provision `/escrow-enclave-production/authority-monitor-trust` from **verified**
attested ledger keys and SHA-256 of concatenated raw PCR0/1/2 bytes. Append allowed
key/measurement pairs (32 keys, 8 measurements each, <=8192 bytes); recycle monitor
execution environments after changes because trust loads at cold start. Set the
legacy ledger trust parameter too. Verify `AuthoritySweepCompleted`, coverage,
integrity, missing-heartbeat, delivery-failure and rate alarms and confirmed SNS
delivery. The monitor must have no authority writes or escrow/credential KMS access.
The kill switch remains manual, not an automatic monitor side effect.

Create a production lca-api interface endpoint for the module's endpoint-service
output, allow only the reviewed endpoint creator, and manually accept the exact
connection. lca-api's serverless.yml creates the endpoint, its SG and the private
zone when `ESCROW_ENCLAVE_ENDPOINT_SERVICE_NAME` and `ESCROW_ENCLAVE_HOSTNAME` are
set together on its GitHub environment; CloudFormation calls as the deploy
identity, so that ARN (not the account root) is `privatelink_allowed_principals`. Configure private DNS/TLS hostname and endpoint SG access from the
production Lambda ENIs. An allowed principal does not create/accept the endpoint.
Expected pages to reconcile with the change record: the apply that adds the
connection notification (`EscrowPrivateLinkChange` for
`CreateVpcEndpointConnectionNotification`), the endpoint's `Connect` notification,
and your acceptance (`Accept` plus `EscrowPrivateLinkChange`). Accept only the exact
endpoint ID from lca-api's stack in the expected owner account.

```sh
aws cloudwatch describe-alarms --alarm-name-prefix escrow-enclave-production
aws ec2 describe-vpc-endpoint-connections --filters 'Name=service-id,Values=<SERVICE_ID>'
aws ec2 describe-vpc-endpoints --vpc-endpoint-ids '<LCA_API_ENDPOINT_ID>'
```

From production lca-api's network (not a public workstation), probe authenticated
`POST /v1/attest` over the PrivateLink TLS path. `GET /health` exists only on the
separate plain-HTTP NLB health-check port 8444, not on the 8443 TLS listener.
Use a trusted interactive terminal with tracing/HTTP debug logging disabled; enter
the bearer token at the hidden prompt, never in command arguments, history or logs.
Install the verifier's `cbor2`/`cryptography` dependencies and obtain the Nitro root
as described in [verify-attestation.py](./scripts/verify-attestation.py). Use the
independently verified production measurements, not host-reported PCRs.

```sh
set +x
python3 - <<'PY'
import getpass
import json
import pathlib
import secrets
import ssl
import subprocess
import tempfile
import urllib.request

nonce = secrets.token_bytes(32)
request = urllib.request.Request(
    'https://<PRODUCTION_PRIVATE_HOST>:8443/v1/attest',
    data=json.dumps({'nonce': list(nonce)}).encode(),
    headers={'Authorization': 'Bearer ' + getpass.getpass('Bearer token: '),
             'Content-Type': 'application/json'},
    method='POST',
)
# Refuse redirects rather than forwarding the Authorization header elsewhere.
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(
    urllib.request.ProxyHandler({}), NoRedirect(),
    urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile='<PRODUCTION_CA_PEM>')),
)
with opener.open(request, timeout=15) as response, tempfile.TemporaryDirectory() as directory:
    path = pathlib.Path(directory) / 'attest.json'
    path.write_bytes(response.read(262145))
    if path.stat().st_size > 262144:
        raise SystemExit('Attestation response exceeds limit')
    subprocess.run([
        'python3', 'services/escrow-enclave-app/scripts/verify-attestation.py',
        str(path), nonce.hex(), '<VERIFIED_PRODUCTION_MEASUREMENTS_JSON>', '<NITRO_ROOT_PEM>',
    ], check=True)
PY
```

Require successful chain/root, signature, nonce and PCR verification, not merely
HTTP 200. During overlap, verify against the reviewed tuple for the responding
image; do not broaden pins from its response. Then exercise authority/email
fail-closed cases with approved disposable identities.

### 9. [operator] Production configuration and rollout gate

`ESCROW_ENCLAVE_MODE` and `ESCROW_RELEASE_KILL_SWITCH` are GitHub environment
toggles on `learn-card-app-api-production` (never stage JSON; enforced by
`escrowDeployment.test.ts`): keep the mode unset and the kill switch `true` until
cutover. The enclave CA is pinned per hostname in `enclaveTrustAnchors.ts`, a
reviewed code change, not `NODE_EXTRA_CA_CERTS`. This branch has **no API PCR-pin configuration field**: do not invent one
in that file. The production **tenant config** pins live at
`auth.sss.escrowEnclaveMeasurements`; copy only verified production tuples there
and select `auth.sss.escrowEnclaveMode=nitro` only after approval. Keep automatic
rollout at zero. The internal URL (`https://escrow-enclave.production.internal:8443`)
and bearer token belong in the runtime secrets bundle, not checked-in stage JSON. Explicit environment overrides
win over stage config; inspect the effective deployment without printing secrets.

```sh
gh api repos/<OWNER>/<REPO>/environments/learn-card-app-api-production/variables --paginate -q '.variables[] | select(.name | startswith("ESCROW_")) | "\(.name)=\(.value)"'
jq '.auth.sss | {escrowEnclaveMode, escrowEnclaveMeasurements}' '<PRODUCTION_TENANT_CONFIG_JSON>'
```

Compare pins against the signed production measurements, validate/rebuild tenant
config, and finish [ROLLOUT.md](./ROLLOUT.md)'s approval gates before enabling any
cohort. No real production hashes or account identifiers are supplied by this work.

## Audit notes and remaining operator decisions

- Environment validations already accept production; resource names derive from
  environment/current account. Existing staging backend IDs remain untouched.
  The staging AMI data lookup gains `[0]`; no managed resource address changes.
- Fixed 50% refresh and `$Latest` were unsuitable for production; production now
  uses 100/200 and a numeric version, while staging retains 50/100 and `$Latest`.
  The existing AZ `check` only warns; production now also has a blocking precondition.
  NLB deletion protection is now production-only. Table deletion protection/PITR,
  30-day CMK deletion windows and audit Object Lock already apply to both environments.
- DMARC `p=none` is now parameterized with the same default. Rate thresholds were
  already variables (100/hour defaults); review them against expected volume.
  Fixed 300-second host grace, 900-second/1024-MiB monitor, 15-minute sweeps,
  365-day logs, zero-tolerance integrity alarms and seven-year Object Lock retention
  remain unchanged. Retention is irreversible for existing locked objects.
- Bootstrap comments/profile defaults and guardrail's default `staging` are
  operational hazards, not resource-name gaps; explicitly select production.
  The fixed `escrow-kms-admin` name is an intentional SCP trust contract in a
  separate account, not a name to parameterize independently.
- No Terraform prevent_destroy protects every resource. Review destructive plans,
  protect state and trust owners, and retain existing key-policy/SCP governance.
  Staging's latest AL2023 AMI lookup, broad HTTPS/Roughtime egress, provider/host package
  updates and production capacity/availability need operational review.
- Variable-name parity was checked against both real `LearnCard-nitro-sync`
  staging tfvars: all 33 core and 3 bootstrap names already exist in the production
  examples; no parity additions were needed and no staging values were copied.
  Publisher resources/data sources all have zero count by default; existing
  staging resources/policies are untouched. Offline disabled-count tests establish
  structural neutrality, not absence of live drift (no live plan was run).
