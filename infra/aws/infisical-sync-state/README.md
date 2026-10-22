# Infisical sync Terraform state bucket

Human-admin-owned root that creates the dedicated, hardened S3 bucket and KMS key
holding Terraform state for [`../infisical-sync`](../infisical-sync). It is kept
separate from other state buckets (Keycloak bootstrap, org guardrails) so access to
one root's state never grants access to another's.

Terraform >= 1.10; AWS provider `~> 6.0`. Applied in `206533012615`, us-east-1.

## What it creates

- A customer-managed KMS key (rotation enabled, 30-day deletion window) and alias
  `alias/learncard-infisical-sync-tfstate`. Its key policy leaves key
  administration (including `PutKeyPolicy`) delegated to IAM, but allows
  encrypt/decrypt only for `admin_principal_arn_patterns` and only via S3, and
  excludes `CreateGrant`. An IAM admin with `kms:PutKeyPolicy` could still rewrite
  the key policy, but the bucket policy denies them the state objects.
- Bucket `learncard-infisical-sync-tfstate-<account>-<region>` with:
    - versioning, superseded versions expired after `noncurrent_version_retention_days`
      (default 90), incomplete multipart uploads aborted after 7 days;
    - default SSE-KMS with the key above and S3 Bucket Keys;
    - all public access blocked and `BucketOwnerEnforced` (ACLs disabled);
    - a bucket policy that denies non-TLS requests, denies every principal not
      matching `admin_principal_arn_patterns`, and denies writes that explicitly
      request encryption other than `aws:kms` or name a KMS key other than this one
      (writes without an SSE header get the bucket's default KMS encryption).

Locking uses S3-native lock files (`use_lockfile = true`); there is no DynamoDB
table. Both the key and bucket have `prevent_destroy`.

The account root user can always replace the bucket policy, so a wrong pattern
list is recoverable.

Both roots are applied by a human admin; no CI role is admitted. If an automation
role ever needs to run `infisical-sync`, add its ARN pattern to
`admin_principal_arn_patterns` (it covers both the bucket and the key) and apply
this root first.

## First apply (bootstrap)

The bucket cannot hold its own state before it exists. Apply once with local
state, then migrate:

```bash
cd infra/aws/infisical-sync-state
export AWS_PROFILE=lc-api
aws sts get-caller-identity --query Account --output text   # must be 206533012615

printf 'terraform {\n  backend "local" {}\n}\n' > backend_override.tf
terraform init
terraform plan  -var-file=environments/production.tfvars -out=state.tfplan
terraform apply state.tfplan

BUCKET=$(terraform output -raw state_bucket_name)
KMS=$(terraform output -raw state_kms_key_arn)
rm backend_override.tf
terraform init -migrate-state \
  -backend-config="bucket=$BUCKET" \
  -backend-config="key=infisical-sync-state/production/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="kms_key_id=$KMS"
rm -f terraform.tfstate terraform.tfstate.backup
```

## Using it from `infisical-sync`

```bash
cd ../infisical-sync
terraform init \
  -backend-config="bucket=$BUCKET" \
  -backend-config="key=infisical-sync/production/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="kms_key_id=$KMS"
```

Always pass `kms_key_id` as the key's full ARN: without it the S3 backend requests
SSE-S3, and an alias or bare key ID doesn't match the pinned ARN; the bucket policy
rejects both.

## Inputs

| Input                               | Default / purpose                                                         |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `environment`                       | Required: staging or production                                           |
| `expected_account_id`               | Required, 12 digits; provider allowlist and caller-identity postcondition |
| `aws_region`                        | us-east-1; region for the bucket and key                                  |
| `admin_principal_arn_patterns`      | Required; `aws:PrincipalArn` patterns allowed to use the bucket           |
| `noncurrent_version_retention_days` | 90 (minimum 30); how long superseded state versions are kept for recovery |

## Offline checks

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
tflint --init && tflint
```
