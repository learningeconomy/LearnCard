# Production infrastructure bootstrap

Operator runbook, not launch approval. Follow [STAGING.md](./STAGING.md)'s
resource → credentials → measured image → monitor → clients order and retain
two-person evidence for every trust change. Commands below are **operator-only**;
no AWS operation is performed by preparing these files. Run from the repository
root unless stated otherwise; replace every `<PLACEHOLDER>` first.

**BLOCKER: the authority Object Lock archiver/outbox is not built.** The legacy
ledger audit bucket and an authority sweep do not provide that missing durable
authority audit path. Do not enable production recovery until it is implemented,
tested, independently monitored, and security-approved. Also close the live
authority/email, Roughtime operations, seven-day soak and residual administrator
risk gates in [SECURITY.md](./SECURITY.md) and [ROLLOUT.md](./ROLLOUT.md).
Keep automatic rollout at zero and `ESCROW_RELEASE_KILL_SWITCH=true` throughout.
This does not disable manual enrollment: keep client mode `off` until approved.

## Sending domain decision

Recommend **`vault.notify.learncard.com`**, delegated by NS from the existing
`notify.learncard.com` zone in the WeLibrary account to a child zone in the new
production escrow account. Staging's `staging.notify.learncard.com` delegation
stays untouched. Obtain the parent zone/account identifiers from the operator
inventory; do not copy staging identifiers into production inputs.

- Delegation isolates DNS administration, DKIM, MAIL FROM and DMARC from other
  notification services; it costs a hosted zone and a one-time parent NS change.
  Subdomains still share organizational-domain reputation; this is not complete
  deliverability isolation.
- Sending directly from `notify.learncard.com` gives a shorter sender address,
  but requires coordinated TXT/DKIM/MX/SPF/DMARC ownership in WeLibrary. Use
  `create_sending_zone=false` and publish `sending_dns_records` there. Do **not**
  create a second, undelegated apex zone or replace existing DMARC/SPF blindly.
- [email.tf](../../infra/escrow-enclave/email.tf) creates SES identity, three DKIM
  CNAMEs, verification TXT, `bounce.<domain>` MX/SPF, TLS-required configuration
  set and bounce/complaint SNS delivery. MAIL FROM failure is `RejectMessage`.
  The sender is exactly `recovery@<domain>`. DMARC defaults to `p=none`; review
  alignment/reports before promoting `email_dmarc_policy` to `quarantine`/`reject`.
  Configure an actual report mailbox (and external-report authorization if needed).
  Terraform manages only the selected sending domain, not the parent DMARC policy.

## Ordered bootstrap and verification

### 1. [operator] New member account and guardrail preparation

Create a **new production member account** in the organization; the existing
staging escrow account is not production. Put it in the security-reviewed escrow
OU, review effective/inherited SCPs and policy attachment quotas, enable an
independently owned CloudTrail trail, and establish break-glass ownership.
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
temporarily omitted, initialize local state and review/apply the bootstrap there.
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
delivery before relying on it, then approve DMARC enforcement separately.

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

Create **`escrow-production`** before dispatching the workflow:

- Required independent reviewers, prevent self-review and disable administrator
  protection bypass. Permit only branch `main` and tags `escrow-enclave-v*` using
  selected deployment branch/tag rules. Protect both main and release-tag creation.
  Do not permit the staging development branch `escrow-recovery/nitro-enclave`.
- Set the complete public `ESCROW_*` measured variables listed in the workflow,
  using production Terraform outputs: tenant/key/region/escrow CMK, previous key
  IDs, first-boot flag, authority region/account/table/writer/tenant/environment/
  generation/credential CMK, and email region/account/sender/from/identity/config set.
  `ESCROW_AUTHORITY_ENVIRONMENT` must be `production`; no access keys in these vars.
- Set `ESCROW_ACCOUNT_ID`, `ESCROW_PUBLISH_ROLE_ARN`, `ESCROW_ARTIFACTS_BUCKET`,
  `ESCROW_ARTIFACTS_KMS_KEY_ARN` (the **storage** CMK, not either enclave CMK).
- The escrow roots currently create **no GitHub OIDC publisher role**. Security
  must provision one separately: issuer `token.actions.githubusercontent.com`,
  audience `sts.amazonaws.com`, exact subject
  `repo:<OWNER>/<REPO>:environment:escrow-production`. Grant only GetObject/PutObject
  on the production bucket's `eif/*`, with conditional create-only writes enforced
  in IAM/bucket policy, plus storage-CMK GenerateDataKey/Decrypt through regional
  S3 and scoped encryption context (account for S3 Bucket Keys). Grant no deletes,
  `sealed-keys/*`, `credentials/*`, Terraform, IAM, or escrow/credential-CMK access.
  Review both the role and storage key policy; an identity grant alone may not suffice.

```sh
gh api 'repos/<OWNER>/<REPO>/environments/escrow-production'
gh api 'repos/<OWNER>/<REPO>/environments/escrow-production/deployment-branch-policies'
gh workflow run escrow-enclave-eif.yml --ref main -f deployment=production
```

The explicit production dispatch builds twice under production variables, signs
the same manifest format, verifies Sigstore identity/issuer and SHA-256 digests,
then publishes using `--if-none-match '*'` and byte-compares readback. Objects live
under `eif/<run-id>/<run-attempt>/`; partial failures require a new attempt, never
an overwrite. Download and retain the signed production measurement evidence for
two-person review. Production does not open the staging measurement PR.

**Baseline discrepancy:** this branch contains no staging S3 publisher or explicit
staging ref gate. Its existing staging build/artifact/tag-PR behavior is unchanged;
the production publisher is new, not a promotion of staging's measured image.

### 7. [terraform] First image, then steady-state image roll

Replace the bootstrap sentinel with verified complete PCR0/1/2 tuples in **both**
CMK policies; never split them into independently combinable PCR lists. At most
**three tuples** are allowed; host count does not consume tuple slots. Review the
signed config as well as digests. Supply the verified host binary and Linux monitor
ZIP separately. Enable credential delivery together with the matching image.

For first boot only, both host input and measured image use first-boot=true.
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
CloudTrail evidence. Every later image roll is: add N+1 to KMS → new-host-first
refresh → verify → append monitor trust → client overlap → remove N from KMS.
Never remove historical verification anchors from monitor trust.

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
connection. Configure private DNS/TLS hostname and endpoint SG access from the
production Lambda ENIs. An allowed principal does not create/accept the endpoint.

```sh
aws cloudwatch describe-alarms --alarm-name-prefix escrow-enclave-production
aws ec2 describe-vpc-endpoint-connections --filters 'Name=service-id,Values=<SERVICE_ID>'
aws ec2 describe-vpc-endpoints --vpc-endpoint-ids '<LCA_API_ENDPOINT_ID>'
curl --fail --cacert '<PRODUCTION_CA_PEM>' 'https://<PRODUCTION_PRIVATE_HOST>:8443/health'
```

Run connectivity checks from production lca-api's network, not a public workstation.
Health alone is insufficient: verify fresh Nitro attestation through that path and
exercise authority/email fail-closed cases with approved disposable identities.

### 9. [operator] Production configuration and rollout gate

Review `services/learn-card-network/lca-api/config/config.production.json` for
non-secret `ESCROW_ENCLAVE_MODE=remote` and `ESCROW_RELEASE_KILL_SWITCH=true` at
cutover. This branch has **no API PCR-pin configuration field**: do not invent one
in that file. The production **tenant config** pins live at
`auth.sss.escrowEnclaveMeasurements`; copy only verified production tuples there
and select `auth.sss.escrowEnclaveMode=nitro` only after approval. Keep automatic
rollout at zero. Internal URL/token and CA delivery belong in the runtime secrets/
deployment configuration, not checked-in stage JSON. Explicit environment overrides
win over stage config; inspect the effective deployment without printing secrets.

```sh
jq '{ESCROW_ENCLAVE_MODE, ESCROW_RELEASE_KILL_SWITCH}' services/learn-card-network/lca-api/config/config.production.json
jq '.auth.sss | {escrowEnclaveMode, escrowEnclaveMeasurements}' '<PRODUCTION_TENANT_CONFIG_JSON>'
```

Compare pins against the signed production measurements, validate/rebuild tenant
config, and finish [ROLLOUT.md](./ROLLOUT.md)'s approval gates before enabling any
cohort. No real production hashes or account identifiers are supplied by this work.

## Audit notes and remaining operator decisions

- Environment validations already accept production; resource names derive from
  environment/current account. Existing staging backend IDs remain untouched.
  No resource addresses were renamed, so no `moved` blocks are needed.
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
  Latest AL2023 AMI lookup, broad HTTPS/Roughtime egress, provider/host package
  updates and production capacity/availability need operational review.
- The requested main-checkout core `staging.tfvars` was absent during preparation.
  The production example covers the complete current root-variable inventory;
  exact parity with that missing file cannot be claimed. Bootstrap's three staging
  variables are covered with placeholders, plus an explicit region.
