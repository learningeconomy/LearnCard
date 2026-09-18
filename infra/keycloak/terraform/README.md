# Keycloak AWS infrastructure

Flat Terraform root for ECS Fargate, an HTTPS Application Load Balancer, and Aurora
PostgreSQL Serverless v2. Requires Terraform >= 1.6 and AWS provider `~> 5.0`, matching
the provider convention in `preview/infra`. CI uses Terraform **1.9.8**.

Clustering: `jdbc-ping` uses PostgreSQL for member discovery only. Cache transport
and failure detection still run task-to-task on TCP 7800 and 57800
([docs](https://www.keycloak.org/server/caching#network-ports)); `network.tf`
opens both from the task security group to itself and nowhere else.

```text
Internet / operators
        |
        v
Route 53: auth + auth-admin
        |
        v
Public subnets (2+ AZs)
  ALB: 80 -> HTTPS 443 (ACM)
    | application :8080         | readiness :9000 (no public listener)
    +---------------------------+
        |
        v
Private subnets (2+ AZs)
  ECS Fargate / Keycloak --optimized
    |   | logs -> CloudWatch
    |   + secrets <- ECS execution role <- Secrets Manager
    |
    + PostgreSQL :5432 -> Aurora writer + production failover instance
    |
    + NAT / private AWS endpoints -> ECR, Logs, Secrets Manager, IdPs
    |
    + task <-> task :7800 (JGroups) / :57800 (FD_SOCK)
```

## Prerequisites and ownership

Provision these outside this root, separately for staging and production:

1. An existing VPC with DNS enabled, public subnets in at least two AZs with an
   internet gateway, and private subnets in at least two AZs. Private tasks need
   outbound NAT for external IdPs, or equivalent controlled egress. Without NAT,
   provide ECR API/DKR, S3, CloudWatch Logs and Secrets Manager endpoints with
   appropriate policies and HTTPS ingress; endpoints alone do not reach IdPs.
   Ensure network ACLs allow return traffic. This root does not create routes.
2. A validated **regional** ACM certificate covering both distinct hostnames,
   and their public Route 53 zone. Never use the ALB DNS name as the issuer.
3. An ECR repository with immutable tags, scanning, retention policies, and a
   Linux **amd64** image built from `infra/keycloak/Dockerfile`. Set `keycloak_image`
   to its full tagged URI; there is no stock-image or `latest` fallback. The image
   must be accessible to the execution role (cross-account ECR also needs a
   repository policy). `keycloak_version` is a descriptive tag only.
4. Two Secrets Manager secrets created **out of band**, in the deployment region:
   database password and temporary bootstrap administrator password. Each secret
   must be a **plain string, not a JSON object**, with no trailing newline. Use a
   PostgreSQL/RDS-compatible password. The execution role can read only these two
   ARNs. This root assumes the AWS-managed `aws/secretsmanager` encryption key;
   customer-managed secret keys require an explicitly reviewed scoped `kms:Decrypt`
   grant and key policy before use. No passwords belong in tfvars or image layers.
5. An S3 state bucket with block-public-access, versioning, enforced encryption
   (prefer default SSE-KMS), TLS-only access and narrowly scoped IAM; and a DynamoDB
   lock table with a string partition key named `LockID`. They must exist before
   init. The deploy identity needs state/lock access, KMS access if applicable,
   database secret read access, and AWS resource provisioning/IAM pass-role rights.

**State is sensitive:** the database password is read by
`data.aws_secretsmanager_secret_version` and stored in Terraform state and saved
plans even though it is redacted in terminal output. Restrict state, bucket
versions, local backups, plan files, and CI log access. Do not upload saved plans
as public artifacts. The bootstrap secret is injected by ECS and is not fetched
by Terraform. Use separate backend keys and credentials per environment.

Realm/client/IdP configuration is **not in this root**. After the server is healthy,
the separate Keycloak Terraform provider layer owns it under AD-8/AD-9. Do not
import local/CI realm fixtures into production. Realm policies (PKCE, disabling
direct grants and self-registration, brute-force detection) belong in that layer
and are required before go-live. After initial setup, establish permanent secured
administrator access and delete the temporary bootstrap account. Changing its
secret does not reset an existing administrator password.

## Image and configuration

[`all-config` for 26.7.4](https://www.keycloak.org/server/all-config) marks `db`,
`health-enabled`, `metrics-enabled`, and `http-relative-path` as **build options**.
They are baked by `kc.sh build`; `start --optimized` cannot change them. In contrast,
`cache` and `cache-stack` are **runtime options** in this version and are explicitly
set to `ispn` and `jdbc-ping` in the ECS task. This intentionally corrects the
AD-9 build-option list. No build options are passed in the task environment.

From the repository root, after authenticating Docker to your ECR registry:

```bash
docker build --platform linux/amd64 --build-arg KEYCLOAK_VERSION=26.7.4 \
  -t "$KEYCLOAK_IMAGE" -f infra/keycloak/Dockerfile infra/keycloak
docker push "$KEYCLOAK_IMAGE"
```

The validation workflow builds but **does not push**. Image publishing is an
explicit prerequisite; dispatching infrastructure deployment never overwrites a
tag. The container uses Keycloak's non-root upstream runtime. Database connections
add `sslmode=require` to the JDBC URL so credentials are not sent in cleartext;
this encrypts transport but does not validate the database's certificate identity.
For verified TLS, add the RDS CA trust material and `verify-full` as a separately
tested image/config change.

## Initialize, plan, apply

1. Complete the prerequisites above.
2. Copy `environments/staging.tfvars.example` to `environments/staging.tfvars` (or
   production equivalents). Replace every placeholder, especially source CIDRs.
   Production must use **at least two tasks**; the root enforces this and places
   its two Aurora instances in different AZs. Staging gets one DB instance.
3. Initialize the selected backend; all location values are supplied at init:

```bash
# From infra/keycloak/terraform; set these shell variables first.
terraform init -reconfigure \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=keycloak/staging/terraform.tfstate" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_STATE_TABLE"
terraform fmt -check -recursive
terraform validate
tflint --init && tflint
terraform plan -var-file=environments/staging.tfvars -out=keycloak.tfplan
terraform apply keycloak.tfplan
```

Use a separate working directory per environment, or explicitly reinitialize with
`-reconfigure` and the correct key when switching. Never migrate staging state into
the production key. `backend.tf` sets `encrypt = true`; DynamoDB locking is retained
for Terraform 1.9 compatibility. Commit the generated provider lockfile for
repeatable provider selection; use `terraform init -upgrade` only in reviewed PRs.

Terraform creates security groups, logs/IAM, ALB rules and database instances before
starting the service; the service waits for steady state. DNS aliases are created
in the same apply, so do not cut over an existing issuer without a migration plan.
After a healthy deployment, configure realms separately and verify issuer URLs,
login/logout, admin isolation from allowed/disallowed networks, ALB readiness,
restart/failover behavior, and backup restoration before enabling real traffic.

### Aurora version and operations

Pinned engine: **Aurora PostgreSQL 16.14**, listed in the
[AWS release calendar](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraPostgreSQLReleaseNotes/aurorapostgresql-release-calendar.html)
(August 21, 2026). Availability varies by region. Before deployment, confirm
Serverless v2 orderability in the target region:

```bash
aws rds describe-orderable-db-instance-options \
  --region "$AWS_REGION" --engine aurora-postgresql --engine-version 16.14 \
  --db-instance-class db.serverless \
  --query 'OrderableDBInstanceOptions[].{Version:EngineVersion,AZs:AvailabilityZones[].Name}'
```

An empty result means do not apply: select a supported, security-reviewed 16.x
release in `rds.tf`. ACU limits are **per instance** (two instances cost more than
one). The root conservatively accepts 0.5-128 ACUs and never auto-pauses. Minor
upgrades are deliberate (`auto_minor_version_upgrade = false`); assign an owner
for timely security patches. Changes are not applied immediately to Aurora.

Backups/PITR default to 14 days; practice restores rather than relying on realm
exports. Production deletion protection defaults on and a final snapshot is
required on deletion. The final name is `<prefix>-production-final`; if reusing a
destroyed stack name, preserve/copy any old final snapshot under another name and
resolve the name collision before the next teardown. Staging skips the final
snapshot. Deletion protection must be explicitly disabled in a reviewed apply
before any planned production teardown.

### ALB and management surface

- Only 80 and 443 are internet-facing; 80 redirects to HTTPS with 301.
- Priority 10 forwards `/admin` and `/admin/*` only on the admin hostname and,
  when set, allowed source CIDRs. Priority 11 accommodates a third CIDR without
  exceeding ALB's five match-evaluation limit.
- Priority 20 returns plain-text 403 for those admin paths otherwise, including
  requests on the public hostname and disallowed sources on the admin hostname.
- Priority 30 forwards other admin-host paths for console assets (`/resources/*`)
  and authentication (`/realms/master/*`), with the same CIDR restriction. Priority
  40 denies the remaining admin-host requests when a CIDR allowlist is configured;
  otherwise the default forward would bypass the source restriction.
- `admin_allowed_cidrs = []` **allows every source on the admin host**; it does not
  bypass Keycloak authentication. Set operator/VPN egress IPv4 CIDRs in production
  (up to three). This restricts the admin **host**, not public realm authentication
  endpoints; `KC_HOSTNAME_ADMIN` alone is not an access-control mechanism.
- Target-group stickiness uses a one-day ALB cookie. Readiness is
  `HTTP :9000/health/ready`, not the login page. The task SG allows 9000 **only from
  the ALB SG** because the management server owns readiness; there is no listener
  or route exposing management health/metrics to public clients. External metrics
  scraping needs its own reviewed private access design.
- Logs use `/ecs/<name_prefix>-<environment>` rather than `/ecs/<name_prefix>` to
  avoid staging/production collisions in a shared account. The output is canonical.

## GitHub Actions

`.github/workflows/keycloak-infra.yml` validates changed infrastructure/image files
on PRs with format, backend-free initialization, validation, **blocking TFLint**,
and a pinned-version Docker build. The same checks gate manual deployment.

Create GitHub environments `keycloak-staging` and `keycloak-production`, with
required reviewers and trusted deployment-branch restrictions (especially for
production). Verify clustering and failover on staging before the first production
apply. Configure each environment:

| Name                    | Kind               | Purpose                                                      |
| ----------------------- | ------------------ | ------------------------------------------------------------ |
| `AWS_ACCESS_KEY_ID`     | Secret             | Scoped deploy identity, matching `deploy.yml`                |
| `AWS_SECRET_ACCESS_KEY` | Secret             | Deploy identity secret                                       |
| `AWS_REGION`            | Variable or secret | Resource and backend region                                  |
| `TF_STATE_BUCKET`       | Variable or secret | Existing state bucket                                        |
| `TF_STATE_TABLE`        | Variable or secret | Existing DynamoDB lock table                                 |
| `TF_VARS`               | Optional secret    | Complete environment tfvars content, without password values |

Non-example `environments/staging.tfvars` / `production.tfvars` must be supplied
later: either deliberately commit reviewed non-secret configuration (these paths
are ignored by default, so intentional tracking is required), or put the entire
file contents in the corresponding environment's `TF_VARS` secret. The workflow
fails rather than deploying examples. `TF_VARS` takes precedence over a committed
file; backend region and environment are also enforced as CLI variable overrides
to prevent accidentally using production sizing/name in the staging state.

Dispatch `plan` to review changes, then `apply` through environment approval. Apply
creates a fresh plan and applies that exact saved plan within the same job; it does
not reuse a previous dispatch's plan. Plans contain secrets and are not uploaded.
Per-environment concurrency and DynamoDB locking prevent simultaneous applies.
No AWS credentials are exposed to PR validation. No automatic push deployments.

## Upgrade / rollback runbook

1. Read Keycloak upgrade notes and test the upgrade against a restored staging DB.
2. Snapshot Aurora and wait until the snapshot is **available**. Record the old image
   URI, config, DB version, snapshot identifier and restore procedure.
3. Build and push a new immutable image tag with the new exact Keycloak version.
   Update the Dockerfile default, workflow build argument, `keycloak_image`, and
   descriptive `keycloak_version` together in a reviewed change.
4. Plan/apply staging, verify auth and failover, then approve production. Use rolling
   deployment only where Keycloak explicitly supports mixed versions for that
   patch stream; incompatible migrations require a maintenance window with old
   tasks stopped before new code accesses the database.
5. **Database migrations are NOT rollback-safe.** ECS circuit-breaker rollback only
   rolls back task definitions, not schema or data. Never assume it makes version
   upgrades reversible. Recovery may require stopping all tasks, restoring the
   pre-upgrade snapshot to a new cluster, reconciling Terraform and the database
   endpoint, then starting the old image. Writes since the snapshot may be lost.

Secret rotation is also coordinated: update the DB password, apply/reconcile it in
Aurora, then replace tasks so ECS re-reads the secret. Updating Secrets Manager alone
does not refresh a running container. Never rotate the DB password independently
of the database. Configure alerts for ALB unhealthy targets/5xx, ECS deployment
failures, DB capacity/connections and backup failures in the organization's
monitoring stack before go-live; this root enables Container Insights and logs but
does not define organization-specific alert destinations.
