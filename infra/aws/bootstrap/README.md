# Keycloak AWS account bootstrap

Human-admin-owned root, applied once per account. Creates state storage, GitHub
OIDC identities, a workload permissions ceiling, immutable ECR and cost alerts.
It does not deploy Keycloak or alter Serverless stacks. Terraform >= 1.10, AWS
provider `~> 6.0` (exact version in the committed three-platform lockfile).

## Prerequisites and ownership

- Separate short-lived administrator sessions/profiles for the accounts selected
  in `environments/staging.tfvars` and `environments/production.tfvars`.
- Terraform, TFLint, and a monitored budget alert email list. No credentials or
  secret values in tfvars, backend configuration, command history, or this repo.
- Exact IAM role ARNs for the current bootstrap admin and permanent break-glass
  administrators. State access is denied to other principals even if they have
  broad account-wide S3 permissions. Use IAM role ARNs, not STS session ARNs.
- Inspect IAM in the console first. The tfvars default to **reusing** the existing
  `https://token.actions.githubusercontent.com` provider. Its audiences must include
  `sts.amazonaws.com`. Set `create_github_oidc_provider=true` only if absent; never
  create a second provider or import another team's provider without agreement.
- Inspect ECR registry replication (staging) and registry policy (production).
  These are **regional singletons**, not additive resources. If already managed,
  stop and coordinate ownership and merge existing rules/statements before applying.
  Do not overwrite another team's registry configuration. Apply production first
  so its repository and replication permission exist before the first staging push.
- Activate the **Project** user-defined cost allocation tag in Billing (payer
  account if using consolidated billing). Budget filtering is
  `user:Project$learncard-keycloak` (Budgets requires the `user:` prefix for
  user-defined tags); activation/reporting can take a day. Untagged and
  non-taggable charges are not covered by this budget. Alerts do not cap spend.
- Reserve the `learncard-keycloak-<env>-*` IAM namespace for these roots. Audit any
  pre-existing roles/policies under it before granting deployment access.

## First apply: local state, then S3

Use **two separate disposable copies of this root**, one per account. Do not switch
environments in a directory holding local state. The committed `backend.tf` is
commented deliberately; `-backend=false` alone is NOT a local-state bootstrap for
a configuration containing an active S3 backend. Run the following Bash steps from
the repository root; choose empty directories and your actual admin profile names.

```bash
umask 077
export BOOTSTRAP_SOURCE="$PWD/infra/aws/bootstrap"
export PRODUCTION_DIR="$HOME/keycloak-bootstrap-production"
export STAGING_DIR="$HOME/keycloak-bootstrap-staging"
mkdir "$PRODUCTION_DIR" "$STAGING_DIR"
cp "$BOOTSTRAP_SOURCE/"*.tf "$BOOTSTRAP_SOURCE/.terraform.lock.hcl" "$PRODUCTION_DIR/"
cp "$BOOTSTRAP_SOURCE/"*.tf "$BOOTSTRAP_SOURCE/.terraform.lock.hcl" "$STAGING_DIR/"
cp -R "$BOOTSTRAP_SOURCE/environments" "$PRODUCTION_DIR/"
cp -R "$BOOTSTRAP_SOURCE/environments" "$STAGING_DIR/"
# Set a JSON list of real, monitored addresses; do not use placeholder recipients.
read -r -p 'Budget alert emails (JSON array): ' TF_VAR_budget_alert_emails
export TF_VAR_budget_alert_emails

export AWS_PROFILE=learncard-production-admin
read -r -p 'Production state administrator IAM role ARNs (JSON array): ' TF_VAR_state_administrator_arns
export TF_VAR_state_administrator_arns
terraform -chdir="$PRODUCTION_DIR" init
terraform -chdir="$PRODUCTION_DIR" apply -var-file=environments/production.tfvars
export PRODUCTION_BUCKET=$(terraform -chdir="$PRODUCTION_DIR" output -raw state_bucket_name)
```

If the provider is absent, add `-var=create_github_oidc_provider=true` to that
account's apply and persist that setting in its reviewed tfvars for subsequent
runs. After the successful first apply, **wait 15 minutes** for first-time S3
versioning propagation. In the **production copy only**, replace the comments in
`backend.tf` with this block (retain it in that operational copy):

```hcl
terraform {
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
```

```bash
terraform -chdir="$PRODUCTION_DIR" init -migrate-state \
  -backend-config="bucket=$PRODUCTION_BUCKET" \
  -backend-config="key=bootstrap/production/terraform.tfstate" \
  -backend-config="region=us-east-1"
# Answer yes to copying the local state, then verify the resource list.
terraform -chdir="$PRODUCTION_DIR" state list

export AWS_PROFILE=learncard-staging-admin
read -r -p 'Staging state administrator IAM role ARNs (JSON array): ' TF_VAR_state_administrator_arns
export TF_VAR_state_administrator_arns
terraform -chdir="$STAGING_DIR" init
terraform -chdir="$STAGING_DIR" apply -var-file=environments/staging.tfvars
export STAGING_BUCKET=$(terraform -chdir="$STAGING_DIR" output -raw state_bucket_name)
```

Wait 15 minutes, put the same active backend block in the **staging copy**, then:

```bash
terraform -chdir="$STAGING_DIR" init -migrate-state \
  -backend-config="bucket=$STAGING_BUCKET" \
  -backend-config="key=bootstrap/staging/terraform.tfstate" \
  -backend-config="region=us-east-1"
terraform -chdir="$STAGING_DIR" state list
```

Verify both remote objects/version histories in the S3 console before securely
removing local state/backup files. Never migrate one environment into the other's
bucket. For subsequent runs use a fresh isolated copy **with the active backend
block**, `init` with that account's bucket/key/region, and the same tfvars. Bootstrap
remains human-owned: CI cannot mutate its IAM controls or read its state prefix.
The account guard checks provider identity, not the backend; independently verify
the backend bucket/account/key before init. Use only the default Terraform workspace.

## Inputs

| Input                                | Default / purpose                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `environment`                        | Required: staging or production                                                                               |
| `expected_account_id`                | Required, 12 digits; per-env file; provider allowlist and resource precondition                               |
| `aws_region`                         | us-east-1                                                                                                     |
| `github_repository`                  | learningeconomy/LearnCard; exact case-sensitive owner/repo                                                    |
| `create_github_oidc_provider`        | false; reuse existing provider                                                                                |
| `replication_destination_account_id` | Required in staging, null in production                                                                       |
| `replication_destination_region`     | us-east-1                                                                                                     |
| `replication_source_account_id`      | Required in production, null in staging                                                                       |
| `monthly_budget_usd`                 | null selects 300 staging / 1000 production; tfvars set these explicitly                                       |
| `budget_alert_emails`                | Required, 1–10 monitored addresses, operator-supplied environment variable                                    |
| `state_administrator_arns`           | Required exact same-account admin/break-glass IAM role ARNs, including bootstrap operator; supply per account |

## Outputs and SSM contract

Every output is also a `String` parameter at
`/learncard-keycloak/<env>/bootstrap/<output-name>`:

| Output name             | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| `state_bucket_name`     | `learncard-keycloak-state-<account>-<region>`  |
| `plan_role_arn`         | `learncard-keycloak-<env>-plan`                |
| `deploy_role_arn`       | `learncard-keycloak-<env>-deploy`              |
| `ecr_repository_url`    | Account-local `learncard/keycloak` URL         |
| `workload_boundary_arn` | Required boundary for all downstream IAM roles |

## Security model and limits

- State: SSE-S3, versioning, noncurrent versions expire after 90 days, TLS-only,
  public access blocked, `prevent_destroy`. No DynamoDB. Plan may read downstream
  states and write/delete only `.tflock`; deploy may also write state. Neither has
  permission to delete current state objects. State remains confidential: realm
  secrets may eventually be present in it. Only allowlisted human admin roles and
  the plan/deploy roles plus the `${name}-realm-runner` CodeBuild role can access
  this bucket; the latter's boundary limits it to realm state. Bootstrap must run
  using one of those human roles, not an IAM user. Keep the admin ARN list available
  for later maintenance and add replacement admins before removing old ones.
  This bucket restriction is not an organization-wide SCP.
- Phase 3 aligns the state principal to `${name}-realm-runner` and allows SSM
  message channels in the workload boundary **only** for `${name}-access-task`.
  Deploy is denied enabling ECS Exec on services or non-access task definitions;
  `ExecuteCommand` is denied for containers other than `access`. Human break-glass
  operators need separate reviewed `ssm:StartSession` permissions; the deploy role
  does not receive account-wide Session Manager access.
- Phase 3 also grants `kms:DescribeKey` only for this region/account's key with
  alias `aws/secretsmanager`, required to create an RDS-managed master secret.
  No decrypt or grant-management actions are added. ECS task-definition
  registration **and deregistration** require wildcard resources and do not expose
  Project resource tags; deregistration is therefore an explicit account-wide
  exception, removed from the tag-deny list so Terraform can replace old revisions.
  IAM simulation must include this documented shared-account lifecycle limitation.
- Plan trust: this repo's `pull_request` or `ref:refs/heads/main`, audience STS.
  AWS-managed ReadOnlyAccess is intentionally account-wide, including discovery
  and potentially application data. Do not grant OIDC tokens to unreviewed fork
  code or upload plans publicly. Review the managed policy as AWS changes it.
- Deploy trust: **only** `environment:keycloak-<env>`, audience STS. Configure
  GitHub environments manually, main-only deployment branches, production required
  reviewers, and prevent self-approval. `keycloak-infra.yml` now uses OIDC and
  validates all three roots. Bootstrap remains human-owned; CI deploys only
  network/service. See the service runbook for GitHub variable setup.
- Deploy can create roles only with the exact workload boundary, and can attach
  or inline policies only on bounded roles. Boundary removal is denied. Own plan/
  deploy roles, all deploy policies and the boundary cannot be mutated or passed.
  The boundary permits only runtime logging, ECR pulls, environment secrets/SSM,
  realm state, CodeBuild ENIs and named RDS backup operations, not IAM or AssumeRole.
  Workload identity policies must narrow this ceiling further (notably ENI subnet/
  SG permissions). Namespaces must not contain pre-existing privileged policies
  attached to unrelated roles. Backup expansion/enhanced monitoring in later
  phases must be reviewed against the ceiling, not solved by allowing `*`.
- PassRole is limited to the namespaced roles and ECS tasks, CodeBuild, RDS,
  RDS monitoring, Backup, **plus VPC Flow Logs** (necessary for the network root).
  AWS service-linked role creation is a separate service-name allowlist; those
  AWS-owned roles do not accept workload boundaries.
- EC2 network actions are enumerated, with no EC2 instance launch/termination.
  Supported EC2/RDS/ECS/ELB existing-resource mutations require
  `aws:ResourceTag/Project=learncard-keycloak`, including rejecting missing tags.
  EC2/ECS/ELB tagging distinguishes tag-on-create from takeover of an existing resource.
  Security-group rule changes check the parent group's tag only: the rule resource
  itself is untagged for AWS's default egress rule and during rule creation.
  RDS lacks that discriminator: its tagging allow is name-scoped, and foreign
  existing Project values are rejected, but initially untagged resources within
  the reserved RDS name prefix can be tagged. Audit that namespace before rollout.
  **This is not complete tag isolation:** create/list calls and some association,
  flow-log, autoscaling, WAF and ACM APIs have different authorization semantics;
  not every service/action exposes resource tags. Route53 hosted zones do not
  support tag-based authorization: record names are constrained to the environment
  auth subtree, but hosted-zone lifecycle is account-wide. Backup plan IDs and
  discovery similarly require broader scope. No Lambda or ElastiCache permissions
  are granted. Before using OIDC, a human must run IAM policy simulation and a
  staging smoke apply, including denials against existing non-Keycloak resources,
  untagged resources and bootstrap IAM. Offline validate/lint cannot prove this.
- SSM and secret names are environment-scoped; RDS-managed `rds!*` secrets use
  generated identifiers and are an explicit account-local exception. ALB log
  buckets must use `${name}-alb-logs-*`. Never repurpose namespaced resources.
- Production cannot push images; staging replication preserves digests. Replication
  only covers new pushes after configuration and is asynchronous. Repository
  settings/lifecycle do not replicate, so both accounts manage them. Retention is
  30 tagged images / 7-day untagged; retain external release artifacts if a running
  digest could age out. Verify the destination digest before promotion.

## Offline checks and references

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
tflint --init && tflint
terraform providers lock -platform=linux_amd64 -platform=linux_arm64 -platform=darwin_arm64
```

Resource arguments follow the [AWS provider resource documentation](https://github.com/hashicorp/terraform-provider-aws/tree/v6.66.0/website/docs/r)
for S3 bucket/versioning/encryption/public-access/policy/lifecycle, IAM OIDC/role/
policy/attachments, ECR repository/lifecycle/replication/registry policy, Budgets
and SSM. [S3 backend locking](https://developer.hashicorp.com/terraform/language/backend/s3#state-locking)
requires Terraform >= 1.10. All three roots now use AWS `~> 6.0`; the former flat
root is `infra/keycloak/terraform/service`. CI and the realm runner pin Terraform 1.15.8.
