# Keycloak service root

Terraform >= 1.10; CI and realm-runner CLI **1.15.8**; AWS `~> 6.0` locked to
**6.66.0**. This root was moved from the never-applied flat root: no state move or
import is required. Do not run Terraform from the parent directory.

```text
Internet -> public ALB :443 -> public target group -> ARM64 Keycloak :8080
              /admin and /realms/master => unconditional 403
CodeBuild / on-demand access task -> private ALB :443 -> separate admin target group
                                                       -> same Keycloak tasks :8080
Both target groups -> readiness :9000 (not exposed by a listener)
Keycloak -> Aurora PostgreSQL 17.10; tasks <-> tasks :7800/:57800
```

Only `/realms/*`, `/resources/*`, `/.well-known/*` are publicly forwarded; unmatched
paths return 404. Admin paths are denied regardless of host or client IP. Public
port 80 redirects to HTTPS. The internal listener forwards only `/admin`,
`/admin/*`, `/realms/master`, `/realms/master/*`, `/resources/*`, otherwise 404.
Its SG admits HTTPS **only** from the realm-runner and access-task SGs. The admin
A record is private; the network root's public admin CNAME is only ACM validation.
Both ALBs log to a TLS-only, public-blocked SSE-S3 bucket with 30-day expiry. The
internal ALB/target-group names are shortened to respect AWS's 32-character limit;
roles, SGs and buckets retain the full namespaced prefix and all resources are tagged.

## Apply order and required human inputs

1. [Bootstrap](../../../aws/bootstrap/README.md), including the Phase 3 IAM updates.
2. [Network](../network/README.md), first apply with certificate wait disabled.
3. GoDaddy NS delegation for `auth` / `auth.staging`.
4. Network re-apply with validation enabled; both certificates must be ISSUED.
5. Service, using the appropriate committed `environments/<env>.tfvars`.
6. Realm root in PR B, then the Phase 3/Appendix A1–A2 staging checks before users.

Supply these per-account values through your shell or reviewed GitHub environment
variables, **not secret values or fabricated image digests in committed tfvars**:

- `TF_VAR_keycloak_image`: account-local `learncard/keycloak@sha256:<digest>`, built
  from the existing optimized Dockerfile for **linux/arm64**. Phase 4 owns image
  publishing; this PR does not build/push a deployable digest. Production uses the
  replicated production registry copy, not staging's URL.
- `TF_VAR_bootstrap_admin_password_secret_arn`: existing plain-string password
  secret under `learncard-keycloak/<env>/`, same account/region. The ECS execution
  role reads only this ARN and the RDS-managed DB secret. Terraform never reads
  their values. Use the AWS-managed Secrets Manager key: the execution role,
  realm runner and workload boundary allow `kms:Decrypt` only for
  `alias/aws/secretsmanager` via Secrets Manager. Custom KMS keys need
  explicitly reviewed permissions first.
- `TF_VAR_db_rotation_risk_acknowledged=true`: explicit acceptance of the temporary
  rotation limitation below. Defaults false and blocks provisioning otherwise.
- `TF_STATE_BUCKET`: selected account's bootstrap output. Use a short-lived deploy
  session; no keys in backend config. Independently verify backend account/key:
  provider account validation does not validate the backend's location.

Example Bash runbook from this directory (repeat in a separate directory for
production by setting `ENVIRONMENT=production` and its account's values):

```bash
export ENVIRONMENT=staging
export AWS_PROFILE=learncard-staging-deploy
export AWS_REGION=us-east-1
read -r -p 'Bootstrap state bucket: ' TF_STATE_BUCKET
read -r -p 'ARM64 ECR image URI with digest: ' TF_VAR_keycloak_image
read -r -p 'Bootstrap administrator password secret ARN: ' TF_VAR_bootstrap_admin_password_secret_arn
export TF_VAR_keycloak_image TF_VAR_bootstrap_admin_password_secret_arn
# Only after accepting and scheduling the rotation mitigation work below:
export TF_VAR_db_rotation_risk_acknowledged=true
terraform init -reconfigure \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=keycloak/$ENVIRONMENT/service.tfstate" \
  -backend-config="region=$AWS_REGION"
umask 077
terraform plan -var-file="environments/$ENVIRONMENT.tfvars" -out=service.tfplan
terraform apply service.tfplan
rm service.tfplan
```

The backend uses encryption and S3-native lockfiles, not DynamoDB. Only the default
Terraform workspace is supported. Plans/state remain confidential even without
password values. Do not upload plans as public artifacts.

## SSM contracts, sizing and behavior

No remote-state chain or manual network-ID inputs. `inputs.tf` reads
`/learncard-keycloak/<env>/network/` parameters: `vpc_id`, `private_subnet_ids`,
`public_subnet_ids`, `public_zone_id`, `private_zone_id`, `auth_certificate_arn`,
`admin_certificate_arn`, `auth_hostname`, `admin_hostname`. Subnet values are
StringLists. It also reads bootstrap `workload_boundary_arn` and `state_bucket_name`.

| Setting                   | Staging            | Production         |
| ------------------------- | ------------------ | ------------------ |
| Task CPU / MiB            | 1024 / 2048, ARM64 | 2048 / 4096, ARM64 |
| Initial / min / max tasks | 1 / 1 / 2          | 2 / 2 / 6          |
| CPU target                | 55%                | 55%                |
| Aurora instances          | 1                  | 2 in distinct AZs  |
| Per-instance ACUs         | 0.5–4              | 2–16               |
| Fixed DB pool per task    | 10                 | 10                 |
| Connection budget         | 100                | 2000               |

Pool initial/min/max are equal; validation includes **200% rolling surge** at max
tasks and requires the sum below 70% of the configured connection budget. Aurora
Serverless v2 derives `max_connections` from the **maximum** ACU and holds it fixed
while scaling ([AWS defaults](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html#aurora-serverless-v2.max-connections):
PostgreSQL 823 at 4 ACU, 3,360 at 16 ACU). The budget stays below that default,
leaving room for admin and RDS-internal connections. Confirm with
`SHOW max_connections` after apply; changing max ACU needs an instance reboot to
update it. Actual use is pool × tasks (at most 120 during a production deploy),
not the budget, so memory at minimum ACU is unaffected. JVM heap remains at upstream
container-aware defaults. Scaling owns desired count after creation; Terraform
ignores its drift. Change min/max for durable sizing changes, not `desired_count`.

Deployment min healthy 100% / max 200%, circuit-breaker rollback and AZ rebalancing
are enabled. They are **not** a schema-upgrade safety guarantee. Per plan PD-7,
`kc.sh update-compatibility check` must decide rolling versus snapshot/stop/recreate
before upgrades; automatic gating is deferred to Phase 4. Restore the pre-upgrade
database if schema rollback is needed; rolling back only the image is unsafe.

Container liveness uses explicit `/bin/bash` and `/dev/tcp` against
`:9000/health/live`, with a bounded read and ECS timeout. The official
[26.7.4 health guide](https://github.com/keycloak/keycloak/blob/26.7.4/docs/guides/observability/health.adoc)
documents Bash TCP probes for the UBI micro image, which lacks curl. Health/metrics
must remain baked into the optimized image. ALBs use `/health/ready`, separately.

Aurora **17.10**, released August 21, 2026, is the newest 17.x minor listed in the
[AWS release calendar](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraPostgreSQLReleaseNotes/aurorapostgresql-release-calendar.html).
[Keycloak 26.7.4](https://www.keycloak.org/server/db#_supported_databases) supports
Aurora PostgreSQL 15–17; **17.5**, not 17.10, is its specifically tested version.
The provider accepts an engine-version string; it cannot prove us-east-1
Serverless orderability offline. Confirm that before applying. Minor upgrades
remain manual. Performance Insights is enabled with 7-day retention; enhanced
monitoring is off. The cluster parameter group logs statements slower than 1s;
slow-query logs can contain user data and require restricted access. PITR is 14
days; production requires a final snapshot and defaults deletion protection on.

Outputs include URLs, cluster/service/log names, DB endpoint, realm project and
access-task details. `outputs.tf` publishes ten String parameters under
`/learncard-keycloak/<env>/service/` with keys matching `local.service_outputs`.
`private_subnet_ids`, `admin_hostname` and `admin_forward_port` are also Terraform
outputs for the access runbook; network remains authoritative for subnet IDs.
The `admin_api_url` parameter is the machine base URL on 443; `admin_url` is the
human console URL including the forwarded port and `/admin/`. PR B must use the
former for its provider. The runner has scoped SSM read permissions for discovery.

## Temporary database rotation risk — not solved

**TODO (platform plan Phase 3, “spike first”):** test the AWS JDBC wrapper's Secrets
Manager/failover plugins with the optimized image, or implement a coordinated
rotation-and-forced-redeployment pipeline. Neither is implemented here. The DB
user remains the RDS-managed master user, not a separate least-privilege owner.

ECS injects the password only at task startup. After automatic or manual rotation,
new pooled connections from running tasks can fail until tasks restart. We set
managed rotation (no Lambda) to **`rate(999 days)`**, with `rotate_immediately=false`,
after Aurora instances exist. This delays risk; it does not remove it or make a
999-day credential lifetime a production security recommendation. AWS's
[schedule guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_schedule.html)
says rate intervals max at 999 days, while the
[API](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_RotationRulesType.html)
allows 1000 for `AutomaticallyAfterDays`; 999 is the longest unambiguous documented
rate expression. Confirm the managed-secret schedule after apply. `false` can
still trigger a rotation test, and manual rotations remain possible. Resolve the
spike before admitting production users; force a fresh ECS deployment immediately
after any rotation and verify new connections. Do not print/read passwords for this.

## Private realm runner

`learncard-keycloak-<env>-realm` runs in private subnets with role
`learncard-keycloak-<env>-realm-runner`, the bootstrap workload boundary, and no
privileged Docker mode. It uses the x86 SMALL `aws/codebuild/standard:7.0` managed
image; it manages Terraform, not the ARM64 Keycloak binary. Role permissions cover
only realm state + lock, environment secrets, discovery SSM parameters, its logs, and required scoped VPC
ENI operations. No webhook, automatic build, artifacts or service-state writes.

Source is the public GitHub repository over HTTPS; no GitHub token is stored here.
The default source is main. Operators/future workflow must pass a **reviewed full
commit SHA** with `--source-version`; whoever can start/override builds effectively
has realm-admin authority. Do not run arbitrary PR commits. If the repository
becomes private, add reviewed CodeConnections authentication rather than a PAT.

The inline project buildspec is loaded from `buildspec-realm.yml`, installs
Terraform 1.15.8 with its published SHA-256 checksum, and fails clearly until PR B
adds `infra/keycloak/terraform/realm` and its env tfvars. It then runs init/apply
inside the VPC against `KEYCLOAK_URL=https://admin.<auth-host>` on 443. PR B must
wire the automation client's secret and provider configuration; no bootstrap
admin password is embedded in the buildspec. Deleting the temporary bootstrap
admin after that first realm apply also belongs to PR B.
Do not delete the bootstrap secret until PR B also removes its reference from
the task definition; deleting the user alone does not remove that startup dependency.

```bash
# Only after PR B lands; REVIEWED_SHA must be an approved commit on main.
aws codebuild start-build --project-name "learncard-keycloak-$ENVIRONMENT-realm" \
  --source-version "$REVIEWED_SHA"
```

## Break-glass human access (Phase 3 spike remains unverified)

No access service runs normally. The access definition is ARM64 256 CPU / 512 MiB,
using [alpine/socat 1.8.1.3](https://hub.docker.com/v2/repositories/alpine/socat/tags/1.8.1.3)
with the committed multi-arch digest. Pulls use Docker Hub through NAT; validate
rate limits and scan the image before operational use. Fargate injects the ECS
Exec agent; the task role has only its four `ssmmessages` channel permissions.
The boundary grants those only to the access-task role, not Keycloak. Its TCP
relay listens only on loopback 8443 and exits after one hour even if abandoned.

**TODO (platform plan PD-4 / Phase 3 spike):** prove hostname-v2 with
`KC_HOSTNAME_ADMIN=https://admin.<auth-host>:8443` and CodeBuild's direct 443 URL.
If redirects/provider behavior fail, use the plan's SSM-only t4g.nano bastion
fallback in a reviewed follow-up, never a public admin listener. No CLI helper or
bastion is implemented here. The default forwarded port is 8443; it is configurable.

Prerequisites: AWS CLI v2, Session Manager plugin, jq, a short-lived **break-glass
operator role** with RunTask/PassRole for this family, DescribeTasks/StopTask, and
StartSession permissions restricted to the session document and these ECS targets.
The Terraform deploy role deliberately has no broad `ssm:StartSession` permission.
Restrict session resume/terminate to the operator's own sessions. CloudTrail audits
session metadata, **not forwarded TLS payloads**.

From the initialized service root, with the correct environment state:

```bash
set -euo pipefail
CLUSTER=$(terraform output -raw ecs_cluster_name)
TASK_DEF=$(terraform output -raw access_task_definition_arn)
ACCESS_SG=$(terraform output -raw access_security_group_id)
SUBNET=$(terraform output -json private_subnet_ids | jq -r '.[0]')
ADMIN_HOST=$(terraform output -raw admin_hostname)
LOCAL_PORT=$(terraform output -raw admin_forward_port)
RUN=$(aws ecs run-task --cluster "$CLUSTER" --task-definition "$TASK_DEF" \
  --launch-type FARGATE --platform-version 1.4.0 --enable-execute-command \
  --propagate-tags TASK_DEFINITION \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$ACCESS_SG],assignPublicIp=DISABLED}")
TASK_ARN=$(jq -er '.tasks[0].taskArn' <<< "$RUN")
trap 'aws ecs stop-task --cluster "$CLUSTER" --task "$TASK_ARN" --reason "Break-glass session ended" >/dev/null' EXIT
aws ecs wait tasks-running --cluster "$CLUSTER" --tasks "$TASK_ARN"
READY=false
for attempt in {1..60}; do
  STATUS=$(aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK_ARN")
  if [[ $(jq -r '.tasks[0].lastStatus' <<< "$STATUS") == STOPPED ]]; then
    echo 'Access task stopped before its managed agent was ready.' >&2
    exit 1
  fi
  RUNTIME_ID=$(jq -r '.tasks[0].containers[] | select(.name=="access") | .runtimeId // empty' <<< "$STATUS")
  AGENT_STATUS=$(jq -r '.tasks[0].containers[] | select(.name=="access") | .managedAgents[]? | select(.name=="ExecuteCommandAgent") | .lastStatus' <<< "$STATUS")
  if [[ "$AGENT_STATUS" == RUNNING && -n "$RUNTIME_ID" && "$RUNTIME_ID" != None ]]; then
    READY=true
    break
  fi
  sleep 5
done
if [[ "$READY" != true ]]; then
  echo 'Timed out waiting for the access managed agent; stopping the task.' >&2
  exit 1
fi
TARGET="ecs:${CLUSTER}_${TASK_ARN##*/}_${RUNTIME_ID}"
# Temporarily add `127.0.0.1 <ADMIN_HOST>` to /etc/hosts manually (use printed name).
printf 'Hosts entry: 127.0.0.1 %s\nOpen: https://%s:%s/admin/\n' "$ADMIN_HOST" "$ADMIN_HOST" "$LOCAL_PORT"
# The relay listens on the task's own port, so use AWS-StartPortForwardingSession.
# AWS-StartPortForwardingSessionToRemoteHost rejects 127.0.0.1 ("forbidden").
aws ssm start-session --target "$TARGET" \
  --document-name AWS-StartPortForwardingSession \
  --parameters "{\"portNumber\":[\"8443\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}"
```

Without `sudo` for `/etc/hosts`, keep TLS verification on and map the name per tool:
`curl --resolve "$ADMIN_HOST:$LOCAL_PORT:127.0.0.1" …`, or run a script in Docker with
`--add-host "$ADMIN_HOST:host-gateway"` (Docker Desktop reaches the host's forwarded port).
The plugin is `session-manager-plugin`; its pkg can be unpacked with `pkgutil --expand-full`
into a user directory when the installer cannot run as root.

**Verified on staging (2026-09-25):** admin console and admin REST load over verified TLS
through this forward with `KC_HOSTNAME_ADMIN` on :8443, so no bastion is needed.

**Secret hygiene:** store `learncard-keycloak/<env>/bootstrap-admin` **without a trailing
newline** (e.g. `openssl rand -base64 36 | tr -d '\n/+='`, never piped through `cut`/`head`,
which append one). ECS injects the string verbatim, so a stray newline becomes part of the
Keycloak password while `bootstrap-realm.ts` and the AWS CLI trim it.

This uses the [documented ECS Session Manager target format](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html#sessions-remote-port-forwarding-ecs-task).
The remote loopback relay preserves TLS/SNI to the internal ALB. Exit the shell
to run its cleanup trap, remove the temporary hosts entry, and confirm the task
stopped. Never set a persistent desired count or enable Exec on Keycloak tasks.

## GitHub workflow configuration

PR and dispatch run a three-root offline validation matrix plus a no-push Docker
build. Only a separate same-repo, trusted-author PR identity smoke job gets a plan
role OIDC token; it checks out no code and runs no Terraform. Forks remain offline.
Credentialed PR plans and image promotion are Phase 4, not implemented here.

Set these **GitHub environment variables**, with main-only deployment branches and
required production review/prevent-self-approval:

| Variable                                 | Value                                                   |
| ---------------------------------------- | ------------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`                    | Bootstrap deploy role ARN                               |
| `AWS_PLAN_ROLE_ARN`                      | Bootstrap plan role ARN (mirror described below)        |
| `TF_STATE_BUCKET`                        | Bootstrap state bucket                                  |
| `AWS_REGION`                             | us-east-1 (default)                                     |
| `KEYCLOAK_CONTAINER_IMAGE`               | Service's account-local ARM64 digest URI                |
| `KEYCLOAK_BOOTSTRAP_ADMIN_SECRET_ARN`    | Service bootstrap password secret ARN, not its contents |
| `KEYCLOAK_DB_ROTATION_RISK_ACKNOWLEDGED` | Explicit `true` only after reviewing the temporary risk |

GitHub environment jobs emit an **environment** OIDC subject, incompatible with
the plan role's PR/main trust. Therefore mirror staging `AWS_PLAN_ROLE_ARN` into
repository variable `KEYCLOAK_STAGING_PLAN_ROLE_ARN`; the isolated PR job has no
environment. Until that variable is set the job is **skipped, not passed**; set it
right after bootstrap and confirm the job runs on the next PR. This is a deliberate exception to environment-only role variables,
not a broadening of IAM trust. Repository maintainers can change workflows: review
is still required, and the IAM PR subject alone cannot distinguish a fork.

Manual dispatch (main only) chooses `root=network|service`, `action=plan|apply` and
environment. Both dispatch actions use the deploy role because of their environment
subject. Apply uses its same-job saved plan; no plans are uploaded. Concurrency
serializes **both roots together per environment**; S3 locking protects each state.
Bootstrap stays human-owned. No static AWS keys or `TF_VARS` secret is used.

## Verification and live-only gates

Offline: `terraform fmt -check -recursive` from `infra/`; in all three roots run
`terraform init -backend=false`, `terraform validate`, `tflint --init && tflint`.
Run `actionlint .github/workflows/keycloak-infra.yml` from the repository root.
Lock providers for linux_amd64, linux_arm64 and darwin_arm64 when upgrading.

Before production, perform the plan's Phase 3 Appendix A1/A2 checks in staging:
two-node JGroups view, public `.well-known` 200 after realm provisioning, `/admin`
and master realm 403, no public admin A/AAAA, and private admin TLS/redirects via
the port forward. Also verify Aurora orderability/secret schedule, pool budget,
actual ARM64 images, IAM role creation/deletion and boundary enforcement, both
target registrations and access logs, autoscaling, CodeBuild source/ENI/secret/
backend access, ECS Exec managed-agent readiness and cleanup. Offline checks
cannot establish any of these. No real users until the rotation spike and these
gates pass. Phase 6 resources below are implemented; their live delivery and restore
gates remain unverified until applied and drilled.

## Phase 6: protection, notification and recovery

Apply the human-owned bootstrap additions **before** applying this service root.
`infra/aws/bootstrap/deploy-observability.tf` adds saved-query and WAF log-delivery
APIs (these lack resource-level IAM authorization), `backup-storage:MountCapsule`,
and AWS Backup managed-key access/grants for vault creation. It also grants
creation/management of a destination CMK only with matching Project, Environment
and `Purpose=keycloak-backup-copy` tags. Existing policies
already cover WAF association/logging, named SNS topics/subscriptions, Events,
CloudWatch alarms/metric filters, cross-region vaults, and PassRole to Backup.
The workload boundary policy (`workload-boundary.tf`) now renders the merged
document from `deploy-observability.tf`, preserving its ARN and every original
statement. Copy the updated bootstrap files into the operational bootstrap
directory before re-applying. The extension applies only to the `${name}-backup` principal:
generated `awsbackup:job-*` Aurora snapshots, source-vault copying, and AWS-managed
RDS/Backup encryption keys. AWS controls snapshot names, so these are an explicit
exception to our naming prefix. Explicit boundary denials prevent copying, deleting
or retagging snapshots with foreign Project/Environment values. RDS has no
tag-on-create discriminator: **untagged AWS-generated snapshots remain a shared-account
namespace exception**, not complete tag isolation. Audit that exception before
production; only the Backup service may assume this role. No runtime role gets SNS
or log-policy administration.
This bootstrap is already live in staging and must be reviewed/applied by a human;
service CI cannot update its own permissions ceiling.

### WAF

The public ALB alone has a REGIONAL ACL with AWS Common, KnownBadInputs and
AmazonIpReputationList groups. Three independent source-IP rate rules match token,
login-actions and broker URI paths under every realm; paths are URL-decoded and
normalized. `waf_rate_limits` defaults to **300 / 200 / 200 per 60 seconds**.
These are commissioning values, not measured capacity or a hard requests/second
limit; shared NAT addresses can contain many legitimate users.

`waf_block_mode=false` in staging counts managed groups (`override_action count`)
and rate rules; production uses `true` (managed `none`, rate `block`). Review at
least one week of counts and login behavior before switching staging to block or
accepting production thresholds. Review false positives, especially query/body
size restrictions and broker callbacks. No rule exceptions are silently enabled.
Logs go to `aws-waf-logs-learncard-keycloak-<env>` for **7 days**. Authorization,
Cookie and query strings are redacted; request sampling is disabled because log
redaction does not apply to samples. Logs still contain IPs/paths: restrict access.

### Alert routes and thresholds

`${name}-critical` and `${name}-warning` both subscribe `alarm_emails`; committed
tfvars set `jackson@learningeconomy.io` in both accounts. **Click Confirm Subscription
in each SNS email** (two per environment). Terraform cannot confirm it for you.
Check SNS Subscriptions: status must be Confirmed, not PendingConfirmation, then
run an A3 delivery test and record receipt. Unconfirmed subscriptions cannot be
deleted normally by Terraform. Staging routes **every** alarm/event to warning;
production sends user-outage alarms to critical. Metric recoveries also notify.
CloudWatch has a source/account-restricted publish grant. EventBridge has a separate
SNS publish grant without conditions, as required by its SNS target integration.

| Suffix / event                        | Condition                                                                          | Production severity |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `public-5xx`                          | Target + ALB 5xx >2% in a 5-minute bucket, >=50 attempted requests                 | critical            |
| `unhealthy`                           | Public TG minimum healthy hosts <1, 2 consecutive minutes                          | critical            |
| `degraded`                            | Healthy hosts <minimum tasks for 10 minutes (staging 1, production 2)              | warning             |
| `running-shortfall`                   | Container Insights desired minus running >0 for 10 minutes                         | warning             |
| `deployment-failed`                   | ECS SERVICE_DEPLOYMENT_FAILED for this service, EventBridge                        | warning             |
| `slow-signin`                         | Public TG response time p95 >1.5s, 15 consecutive minutes                          | warning             |
| `cpu`, `memory`                       | Average >80% for 15 minutes while running >=maximum tasks                          | warning             |
| `db-capacity`                         | Maximum cluster instance ACU >=90% of max for 15 minutes (3.6 / 14.4)              | warning             |
| `db-connections`                      | Maximum instance connections >80% of `db_connection_budget`, 5 minutes (80 / 1600) | warning             |
| `db-replica-lag`                      | Maximum AuroraReplicaLag >1000ms for 10 minutes; only with >1 instance             | warning             |
| `db-failover`                         | Cluster RDS failover category, EventBridge                                         | warning             |
| `backup-failed`, `backup-copy-failed` | Backup FAILED/EXPIRED or copy FAILED for this cluster                              | warning             |
| `login-errors`                        | >`login_error_threshold` (100) LOGIN_ERRORs per 5 minutes                          | warning             |
| `waf-blocks`                          | >`waf_block_threshold` (100) BlockedRequests per 5 minutes                         | warning             |
| `acm-renewal`, `acm-action-required`  | AWS Health ACM renewal codes; scoped ACM action-required events                    | warning             |
| Budget (bootstrap-owned)              | 80% / 100% monthly budget, existing email route                                    | warning             |

The 5xx denominator adds ELB failures to RequestCount because ALB RequestCount
omits requests rejected before target selection; an all-503 outage must not evade
the 50-request guard. Healthy-host missing data breaches (including a zero-task
outage); idle traffic/capacity/event-derived metrics use notBreaching. Low-sample
p95 is ignored. There is deliberately no per-restart or individual-4xx alarm.
`BlockedRequests` stays quiet in count mode; inspect per-rate-rule CountedRequests
instead. CPU/memory are service averages, not single-task restart detectors.

Login errors use a **static commissioning threshold**, not a claimed 7-day trained
baseline. After seven days, set it to five times the measured comparable 5-minute
baseline. Keycloak 26.7.4's `JBossLoggingEventListenerProvider` emits
`type=LOGIN_ERROR` (optionally quoted) **inside JSON `message`**, with
`loggerName=org.keycloak.events`. The filter matches both quote forms. Realm-as-code
must enable `jboss-logging` and saved user/admin events; this root never edits realms.
Successful/admin event logging may need listener success log level INFO rather than
its DEBUG default; coordinate that setting with the realm/image owner. JSON stdout
already flows through awslogs. Saved queries find failed logins by IP and broker
errors. ALB logs live in S3, so no misleading CloudWatch query for ALB 5xx paths is added.

`synthetic_signin_alarm_placeholder` must remain false: no scheduled publisher or
sign-in alarm exists yet. The QA driver and discovery/JWKS workflow are not a
5-minute production synthetic alarm. Commission that separately after the realm
exists. Repo variable `KEYCLOAK_STAGING_REALM_LIVE=true` makes discovery/JWKS failures
fatal in the existing staging health workflow; `/admin/` must always return 403.

### Backup and live gates

`enable_aws_backup=false` in staging, true in production. Daily **07:00 UTC**
snapshots (60-minute start window, 180-minute completion window) select only this
Aurora cluster and retain **35 days** locally and in `backup_copy_region` (default
**us-west-2**) via `aws.backup_copy`. The source vault uses AWS-managed encryption;
Aurora snapshots inherit the source database key. The destination uses a dedicated,
rotating customer-managed KMS key: `alias/aws/backup` is **not compatible** with
Aurora cross-region copies. That key has `prevent_destroy` and a 30-day deletion
window; disabling backups after creation requires a reviewed key-retirement change.
Both vaults refuse forced deletion of recovery points. Same-account cross-region copies are
supported; this is not cross-account protection or immutable Vault Lock. Custom
source DB keys require a separately reviewed key-policy/IAM change. PITR remains 14 days
and production deletion protection remains unchanged. Do not disable the plan
until retained recovery points and vault retirement have been reviewed.

After apply, inspect backup and copy job success, list recovery points in **both**
regions, and perform A6 restore/sign-in from a copied snapshot. An existing vault
alone proves nothing. Confirm the backup window does not conflict with actual RDS
maintenance/automated-backup windows. Verify IAM with real job execution; Terraform
validate cannot establish service authorization. Run [QA scripts](../../qa/README.md)
for A3 and record SNS receipt, original state, cleanup and alarm recovery. These
live checks, count-to-block rollout and production readiness remain human gates.

Provider arguments were checked against [AWS provider v6.66.0 resource docs](https://github.com/hashicorp/terraform-provider-aws/tree/v6.66.0/website/docs/r),
[Backup EventBridge payloads](https://docs.aws.amazon.com/aws-backup/latest/devguide/eventbridge.html),
[ACM events](https://docs.aws.amazon.com/acm/latest/userguide/supported-events.html), and
[Keycloak's versioned event logger](https://github.com/keycloak/keycloak/blob/26.7.4/services/src/main/java/org/keycloak/events/log/JBossLoggingEventListenerProvider.java).
