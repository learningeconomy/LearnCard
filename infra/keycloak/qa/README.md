# Keycloak QA & Observability

Operational QA runbooks and health-check scripts for Keycloak staging and production environments.
Maps to Appendix A (A1–A10) of `.sisyphus/plans/keycloak-aws-platform.md`.

## Files

### K6 Probes & Load Tests

- **`probe.js`** — Discovery probe: loops `.well-known/openid-configuration` and refresh-token grant at 5 rps.
  Reports non-2xx counts per 10s window. Used during disruptive drills (A4–A8).

    ```bash
    k6 run infra/keycloak/qa/probe.js -e HOST=auth.staging.learncard.app
    ```

- **`load.js`** — Load test with burst scenario (500 req/min). Includes default ramping scenario (10–50 req/s).
    ```bash
    k6 run infra/keycloak/qa/load.js -e HOST=auth.staging.learncard.app
    k6 run infra/keycloak/qa/load.js -e HOST=auth.staging.learncard.app --scenario burst
    ```

### Sign-In & Security Tests

- **`signin.ts`** — Playwright-based authorization-code PKCE flow test. Staging-only (requires `KEYCLOAK_STAGING_REALM_LIVE=true`).
  Tests full sign-in flow: auth endpoint → login form → code exchange → token.

    ```bash
    KEYCLOAK_STAGING_REALM_LIVE=true \
    KEYCLOAK_TEST_USER=testuser \
    KEYCLOAK_TEST_PASSWORD=testpass \
    bunx playwright test infra/keycloak/qa/signin.ts
    ```

- **`prod-check.ts`** — Production security checklist (A10). Asserts via admin REST API:
    - No bootstrap admin user
    - All clients have `directAccessGrantsEnabled=false`
    - `learncard-app` has PKCE S256
    - Realm has `bruteForceProtected=true`
    - Events enabled

    Requires: `KEYCLOAK_ADMIN_URL`, `KEYCLOAK_ADMIN_USER`, `KEYCLOAK_ADMIN_PASSWORD`.
    Exit code 1 on any assertion failure.

    ```bash
    KEYCLOAK_ADMIN_URL=https://admin.auth.learncard.app \
    KEYCLOAK_ADMIN_USER=terraform-realm \
    KEYCLOAK_ADMIN_PASSWORD=<secret> \
    bunx ts-node infra/keycloak/qa/prod-check.ts
    ```

### Alarm Induction Scripts (A3)

Six shell scripts to induce and verify alarms. All are **staging-only** (guard: `ENV=staging`).
Each script includes cleanup instructions.

| Script                | Alarm                               | Method                          | Cleanup           |
| --------------------- | ----------------------------------- | ------------------------------- | ----------------- |
| `alarm-unhealthy.sh`  | Unhealthy hosts / running < desired | Stop one task                   | ECS replaces task |
| `alarm-5xx.sh`        | ALB 5xx                             | set-alarm-state + scale to 0    | Scale back up     |
| `alarm-deployment.sh` | Deployment failed                   | Deploy invalid image            | Auto-rollback     |
| `alarm-capacity.sh`   | CPU / ACU / connections             | k6 burst load                   | Stop load test    |
| `alarm-backup.sh`     | Backup failed                       | set-alarm-state (delivery test) | Reset state       |
| `alarm-waf.sh`        | WAF blocks spike                    | k6 burst to token endpoint      | Stop load test    |

Usage:

```bash
./infra/keycloak/qa/alarm-unhealthy.sh staging
./infra/keycloak/qa/alarm-5xx.sh staging
# ... etc
```

## Runbook Mapping (Appendix A)

### A1 — Cluster Formation (Phase 3)

```bash
aws ecs update-service --cluster learncard-keycloak-staging --service learncard-keycloak-staging --desired-count 2
aws ecs wait services-stable --cluster learncard-keycloak-staging --services learncard-keycloak-staging
aws logs filter-log-events --log-group-name /ecs/learncard-keycloak-staging --filter-pattern '"ISPN000094"'
```

**PASS**: Latest JGroups view lists 2 members.

### A2 — Public Admin Surface Closed (Phases 3, 8)

```bash
curl -s -o /dev/null -w '%{http_code}' https://auth.staging.learncard.app/admin/
# Expected: 403

curl -s -o /dev/null -w '%{http_code}' https://auth.staging.learncard.app/realms/master/.well-known/openid-configuration
# Expected: 403

curl -s -o /dev/null -w '%{http_code}' https://auth.staging.learncard.app/realms/learncard/.well-known/openid-configuration
# Expected: 200

dig +short admin.auth.staging.learncard.app
# Expected: empty (no public DNS record)

curl -s -o /dev/null -w '%{http_code}' -X POST https://auth.staging.learncard.app/realms/learncard/protocol/openid-connect/token \
  -d grant_type=password -d client_id=learncard-app -d username=x -d password=y
# Expected: 400/401 with unauthorized_client (Direct Access Grants disabled)
```

**PASS**: All checks match.

### A3 — Alarm Induction (Phase 6)

Use the six `alarm-*.sh` scripts. Each fires an alarm and verifies SNS delivery.

```bash
./infra/keycloak/qa/alarm-unhealthy.sh staging
./infra/keycloak/qa/alarm-5xx.sh staging
./infra/keycloak/qa/alarm-deployment.sh staging
./infra/keycloak/qa/alarm-capacity.sh staging
./infra/keycloak/qa/alarm-backup.sh staging
./infra/keycloak/qa/alarm-waf.sh staging
```

**PASS**: Every alarm fires and delivers once; all return to OK.

### A4 — Task Kill Under Load (Phase 7)

```bash
k6 run infra/keycloak/qa/probe.js -e HOST=auth.staging.learncard.app &
PROBE_PID=$!

TASK_ARN=$(aws ecs list-tasks --cluster learncard-keycloak-staging --service-name learncard-keycloak-staging --query 'taskArns[0]' --output text)
aws ecs stop-task --cluster learncard-keycloak-staging --task "$TASK_ARN"

aws ecs wait services-stable --cluster learncard-keycloak-staging --services learncard-keycloak-staging

kill $PROBE_PID
```

**PASS**: Probe non-2xx ≤ 1% in any 10s window, 0 after 60s.

### A5 — Aurora Failover (Phase 7)

```bash
k6 run infra/keycloak/qa/probe.js -e HOST=auth.staging.learncard.app &
PROBE_PID=$!

aws rds failover-db-cluster --db-cluster-identifier learncard-keycloak-staging
aws rds describe-events --source-type db-cluster --source-identifier learncard-keycloak-staging --duration 30

kill $PROBE_PID
```

**PASS**: Probe errors cease ≤ 60s after failover event; no task restarts.

### A6 — Point-in-Time Restore (Phases 7, 8)

```bash
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier learncard-keycloak-staging \
  --db-cluster-identifier learncard-keycloak-staging-restore-drill \
  --use-latest-restorable-time \
  --db-subnet-group-name learncard-keycloak-staging \
  --vpc-security-group-ids <db-sg>

aws rds create-db-instance \
  --db-instance-class db.serverless \
  --engine aurora-postgresql \
  --db-cluster-identifier learncard-keycloak-staging-restore-drill \
  --db-instance-identifier learncard-keycloak-staging-restore-drill-1

# Run one-off task with KC_DB_URL overridden to restore endpoint
aws ecs run-task --cluster learncard-keycloak-staging --task-definition learncard-keycloak-staging \
  --overrides '{"containerOverrides":[{"name":"keycloak","environment":[{"name":"KC_DB_URL","value":"jdbc:postgresql://..."}]}]}'

# Port-forward via access task, query DB, sign in
psql -h localhost -U keycloak -d keycloak -c "select count(*) from user_entity where realm_id=(select id from realm where name='learncard')"

# Cleanup
aws ecs stop-task --cluster learncard-keycloak-staging --task <task-arn>
aws rds delete-db-instance --db-instance-identifier learncard-keycloak-staging-restore-drill-1 --skip-final-snapshot
aws rds delete-db-cluster --db-cluster-identifier learncard-keycloak-staging-restore-drill --skip-final-snapshot
```

**PASS**: Counts match; sign-in succeeds; RTO recorded.

### A7 — Rolling Patch Upgrade (Phase 7)

```bash
k6 run infra/keycloak/qa/probe.js -e HOST=auth.staging.learncard.app &
PROBE_PID=$!

# Merge patch-bump PR or re-deploy current digest
# (Workflow runs compatibility gate, applies service)

kill $PROBE_PID
```

**PASS**: Gate reports `rolling`; probe non-2xx ≤ 1% per window; one deployment COMPLETED.

### A8 — Recreate Upgrade (Phase 7)

```bash
k6 run infra/keycloak/qa/probe.js -e HOST=auth.staging.learncard.app &
PROBE_PID=$!

# Deploy image gate flags incompatible (next minor)
# (Workflow runs compatibility gate, creates snapshot, scales to 0, deploys, scales up)

aws rds describe-db-cluster-snapshots --db-cluster-identifier learncard-keycloak-staging
# Should show pre-upgrade-<sha> snapshot

kill $PROBE_PID
```

**PASS**: Snapshot created; service scaled to 0 → new version healthy → `.well-known` 200 → sign-in passes.

### A9 — Break-Glass Admin (Phase 7)

```bash
bun run lc keycloak admin staging
# Browser opens admin console
# View realm, exit
```

**PASS**: Console loads over TLS without hostname errors; access task stops on exit.

### A10 — Production Security Checklist (Phase 8)

```bash
KEYCLOAK_ADMIN_URL=https://admin.auth.learncard.app \
KEYCLOAK_ADMIN_USER=terraform-realm \
KEYCLOAK_ADMIN_PASSWORD=<secret> \
bunx ts-node infra/keycloak/qa/prod-check.ts

# Plus AWS checks:
curl -s -o /dev/null -w '%{http_code}' https://auth.learncard.app/admin/
# Expected: 403

aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::206533012615:role/learncard-keycloak-production-deploy \
  --action-names lambda:InvokeFunction elasticache:DescribeCacheClusters \
  --resource-arns arn:aws:lambda:us-east-1:206533012615:function:* arn:aws:elasticache:us-east-1:206533012615:cluster/*
# Expected: implicitDeny/explicitDeny

aws s3api get-bucket-policy --bucket learncard-keycloak-state-206533012615-us-east-1
# Review: denies non-TLS and non-role principals
```

**PASS**: Script exits 0; all assertions printed; AWS checks pass.

## Environment Variables

| Variable                      | Purpose                                       | Example                            |
| ----------------------------- | --------------------------------------------- | ---------------------------------- |
| `HOST`                        | Keycloak hostname (k6 probes)                 | `auth.staging.learncard.app`       |
| `KEYCLOAK_STAGING_REALM_LIVE` | Guard for signin.ts (staging-only)            | `true`                             |
| `KEYCLOAK_TEST_USER`          | Test username for signin.ts                   | `testuser`                         |
| `KEYCLOAK_TEST_PASSWORD`      | Test password for signin.ts                   | `testpass`                         |
| `KEYCLOAK_ADMIN_URL`          | Admin API base URL (prod-check.ts)            | `https://admin.auth.learncard.app` |
| `KEYCLOAK_ADMIN_USER`         | Admin username (prod-check.ts)                | `terraform-realm`                  |
| `KEYCLOAK_ADMIN_PASSWORD`     | Admin password (prod-check.ts)                | `<secret>`                         |
| `BOOTSTRAP_ADMIN_USERNAME`    | Bootstrap admin name to check (prod-check.ts) | `admin`                            |

## Verification

Before running drills:

1. **K6 installed**: `k6 version`
2. **Playwright installed**: `bunx playwright --version`
3. **AWS CLI v2**: `aws --version`
4. **Bun**: `bun --version`
5. **Shell scripts pass shellcheck**: `shellcheck infra/keycloak/qa/alarm-*.sh`

## Notes

- All alarm scripts are **staging-only** by default. Remove the `ENV` guard to run in production (not recommended).
- Probe and load tests require network access to the Keycloak host.
- `prod-check.ts` requires valid admin credentials (from Secrets Manager or environment).
- Alarm induction scripts clean up automatically or via manual steps documented in each script.
