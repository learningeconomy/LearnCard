# Keycloak operational QA

These are operator-run tools for [platform-plan Appendix A](../../../.sisyphus/plans/keycloak-aws-platform.md).
They are **not evidence that a live drill passed**. Use a reviewed staging change
window, short-lived operator credentials, AWS CLI v2, jq, curl, Bun and external
k6. No npm dependency is added. Playwright is already declared in
`tests/smoketests/package.json`; `signin.ts` resolves that workspace's installation.
Install its Chromium browser before an approved live sign-in run. Never put real
tokens/passwords in command history, reports, k6 JSON outputs, or committed files.

## Traffic tools

```bash
k6 run -e HOST=auth.staging.learncard.app -e DURATION_SECONDS=600 infra/keycloak/qa/probe.js
CONFIRM_STAGING_LOAD=true SCENARIO=burst k6 run infra/keycloak/qa/load.js
```

`probe.js` sends discovery at **5 requests/second**. Optional environment
`REFRESH_TOKEN` **and** `CLIENT_ID` enable a separate single-VU refresh loop up to
5/s; optional `CLIENT_SECRET` supports a confidential synthetic client. The single
VU carries rotated refresh tokens forward, avoiding concurrent replay. Discovery
continues if refresh is disabled, but that does **not** satisfy A4/A5 session-survival
proof. Every non-2xx, including 400, is a failure. The summary prints request counts,
non-2xx counts and failure rates in 10-second elapsed windows; per-window thresholds
fail above 1%; dropped iterations also fail. Windows include the 30-second graceful
shutdown so late failures are not discarded. A 200 malformed token response is a
semantic failure in `failureRate` even though it is not a non-2xx. Use k6's JSON output only with restrictive local permissions if
timestamps are needed to prove zero errors after recovery. `DURATION_SECONDS`
defaults 600, range 10–3600; `REALM` defaults learncard. Bounded request timeouts
mean a completed request is attributed to its completion window.

`load.js` selects **one** scenario with `SCENARIO` (k6 has no `--scenario` flag):

- `burst`: 500 token requests/minute from the generator's IP for 5 minutes;
  invalid synthetic refresh grants are deliberate. 400/401 before WAF blocking and
  403 after blocking are expected; inspect `token_status` and WAF counters.
- `capacity` (default): ramp for 1 minute, hold `RATE` requests/second (default 30)
  for `DURATION` (default 20m), then ramp down 30s. Requires `CLIENT_ID` and
  `REFRESH_TOKENS`, a JSON array of independent synthetic-user sessions, at least
  one per `VUS` (default 10). Each VU rotates its own token. This exercises valid
  refresh, not expensive password hashing; Phase 7 must additionally exercise the
  real ticket/hop or browser sign-in mix before sizing is accepted. Invalid refresh
  tokens are not a valid DB-capacity test. Optional `CLIENT_SECRET` is supported.

All load requires `CONFIRM_STAGING_LOAD=true` and exactly the staging hostname.
Increase rate only in a reviewed window; WAF count mode is useful for capacity
tests so a generator's single IP is not throttled. CPU/memory alarms require max
task count and 15 sustained minutes; request volume alone cannot guarantee them.

## Synthetic sign-in (A6/A8)

Run with `bun infra/keycloak/qa/signin.ts`, not the Playwright test runner. Required
environment (inject secrets from the approved secret store, not literal CLI args):

| Variable                                       | Purpose                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `ENV`                                          | Must be staging                                                    |
| `KEYCLOAK_BASE_URL`                            | HTTPS staging origin, or TLS localhost tunnel to a staging restore |
| `KEYCLOAK_CLIENT_ID`                           | Approved synthetic **public standard-flow** client                 |
| `KEYCLOAK_REDIRECT_URI`                        | Exact registered HTTPS callback or localhost HTTP callback         |
| `KEYCLOAK_TEST_USER`, `KEYCLOAK_TEST_PASSWORD` | Dedicated synthetic account                                        |
| `KEYCLOAK_REALM`                               | Optional, defaults learncard                                       |

The driver generates S256 PKCE and state, signs in via the Keycloak form, captures
the callback without sending its code to an app, validates state, exchanges the
code with a URL-encoded request, and logs out the synthetic session. Browser cleanup
runs on failure. No direct-access/password grant, screenshots, traces or token
logging. Required-action/MFA/social-only forms intentionally fail; provision the
synthetic user/client through the realm workstream, never with this script.
Production snapshot restore checks use a scratch isolated **staging test host**,
not the production sign-in endpoint; review data-access authorization separately.

## Production admin assertions (A10)

Run `bun infra/keycloak/qa/prod-check.ts` from CodeBuild/private admin access with:

- `KEYCLOAK_BASE_URL`: private HTTPS admin origin (no path).
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`: master-realm service-account
  credentials with read/query rights for master users and all managed realms.
- `KEYCLOAK_REALMS`: comma-separated managed realms, default learncard. Supply the
  full realm-as-code inventory; an omitted realm cannot be checked.
- `BOOTSTRAP_ADMIN_USERNAME`: name to assert absent, default admin.

Uses **client_credentials**, never an administrator password. It prints each
assertion and exits nonzero on HTTP/schema/assertion failure: exact bootstrap-user
lookup, paginated client inventory, every client's direct grants explicitly false,
learncard-app present and PKCE S256, brute-force protection, saved user/admin events
and jboss-logging listener. No state/realm mutation. Separately perform A2, IAM
simulation against real non-Keycloak Lambda/ElastiCache ARNs in the selected account,
and review state-bucket TLS/principal denials; the script explicitly does not claim
to automate AWS checks.

## A3 alarm induction

Read each script before running with `bash infra/keycloak/qa/alarm-<name>.sh`.
The scripts require `ENV=staging` (or positional `staging`),
`ALLOW_DESTRUCTIVE_ALARM_TEST=yes`, and `EXPECTED_AWS_ACCOUNT_ID=281762601323`;
each checks the caller's account before mutation. The backup delivery drill also
requires the exact `WARNING_SNS_TOPIC_ARN` output for staging. Follow the exact
environment checks in their headers. They use the AWS CLI only when **you run them**. Cleanup traps restore
modified service state or remove temporary resources. A SIGKILL, machine loss, or
expired AWS session can defeat cleanup: retain original task definition, desired
count and autoscaling state outside the terminal and recover them manually.

| Script                | Induction                                                     | Observe and cleanup                                                                       |
| --------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `alarm-unhealthy.sh`  | Stop one service task                                         | ECS replaces it; inspect unhealthy/shortfall history and return to stable                 |
| `alarm-5xx.sh`        | Delivery state override plus real two-minute zero-task outage | Restore original desired/scaling state; verify ELB 5xx and recovery                       |
| `alarm-deployment.sh` | Register invalid image-digest revision and deploy             | ECS failure event to warning SNS; restore original revision and deregister drill revision |
| `alarm-capacity.sh`   | Valid sustained refresh load                                  | CPU/ACU/connections metrics, scaling activity; stop load                                  |
| `alarm-backup.sh`     | Temporary alarm delivery test only                            | Confirm warning SNS delivery; remove temporary alarm                                      |
| `alarm-waf.sh`        | Token burst from one IP                                       | CountedRequests in count mode, BlockedRequests in block mode; stop load                   |

**Receive the SNS email and record it yourself.** An API success is not delivered
email. EventBridge deployment/backup rules are not CloudWatch metric alarms, so
`describe-alarm-history` on their rule names is invalid. The temporary backup alarm
proves the CloudWatch→SNS route only, not actual Backup→EventBridge matching;
inspect the deployed rule against AWS's documented event payload and observe real
job/copy events after enabling Backup. Staging Backup is normally off.

Stopping one task may recover before the 2-minute unhealthy or 10-minute degraded
window, especially with two tasks. Do not shorten production thresholds or report
that as successful induction: record the result and use a reviewed sustained
outage/delivery test for notification proof. WAF count mode cannot trip the
BlockedRequests alarm; record counts first, then prove block delivery only after
the reviewed count-to-block transition. The default burst exceeds the token limit
(300/min) and the block threshold (100/5min) after WAF's approximate evaluation delay.

## Full Appendix A / phase gate mapping

| Item           | Tools and operator procedure                                                                                                                                                      | PASS / cleanup                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A1, Phase 3    | Temporarily two staging tasks; inspect latest `ISPN000094` JGroups log view                                                                                                       | Two members; restore original task count/scaling settings                                                                    |
| A2, Phases 3/8 | curl public `/admin/` and master discovery (403), managed discovery (200); external DNS admin A/AAAA absent; disabled password grant returns 400/401 unauthorized_client          | All match; no mutation                                                                                                       |
| A3, Phase 6    | Six scripts above                                                                                                                                                                 | Evidence for every row, SNS receipt, recovered alarms and cleanup; no live result claimed here                               |
| A4, Phase 7    | Probe with refresh, two healthy tasks, stop one task                                                                                                                              | <=1% per 10s window, zero after 60s, pre-existing session refresh succeeds; ECS replaces task                                |
| A5, Phase 7    | Temporarily two DB instances; probe and Aurora failover                                                                                                                           | Errors stop <=60s after failover-start; no task restart; restore one staging DB instance                                     |
| A6, Phases 7/8 | Restore PITR or production copy to NEW scratch cluster + Serverless instance; isolate scratch task with restored DB connection; compare realm user counts via psql; run signin.ts | Counts as-of-restore match, sign-in passes, record RTO; stop scratch task, delete scratch instance then cluster after review |
| A7, Phase 7    | Probe during compatibility-gated rolling patch deploy                                                                                                                             | Rolling gate; <=1% errors/window; one COMPLETED deployment                                                                   |
| A8, Phase 7    | Probe during incompatible recreate deploy, then signin.ts                                                                                                                         | Snapshot exists before scale-to-zero, healthy after deploy, measured downtime; rehearse snapshot rollback through A6         |
| A9, Phase 7    | Reviewed private-admin CLI/access-task runbook                                                                                                                                    | TLS/hostname correct, task stops on exit, CloudTrail session audit; remove temporary hosts entries                           |
| A10, Phase 8   | prod-check.ts plus A2 and separate IAM/state-policy review                                                                                                                        | All printed assertions pass; no public admin or direct grants; non-Keycloak mutations denied                                 |

The [service README](../terraform/service/README.md) owns private access setup and
known Phase 3 prerequisites. Appendix A's scratch restore commands are a procedure,
not a turnkey safe script: supply reviewed SG/subnets, CPU/ACU settings, distinct
names and restored-secret wiring. Never point a live service at a scratch DB or
reuse its cleanup commands for the source cluster. Phase 7 requires a second
engineer to reproduce the restore and one week without unexplained alarms.

## Workflow / offline checks

The existing `.github/workflows/staging-health-check.yml` retains UptimeRobot and
its triggers. Added checks always assert public admin 403 and fetch discovery's
same-origin JWKS with nonempty keys. Discovery/JWKS failure warns until repository
variable `KEYCLOAK_STAGING_REALM_LIVE=true`, then fails. This is not a scheduled
production synthetic sign-in monitor (that remains a documented placeholder).

```bash
shellcheck infra/keycloak/qa/alarm-*.sh
actionlint .github/workflows/staging-health-check.yml
bun build --target=bun --external @playwright/test infra/keycloak/qa/signin.ts infra/keycloak/qa/prod-check.ts --outdir /tmp/keycloak-qa-build
k6 inspect infra/keycloak/qa/probe.js
CONFIRM_STAGING_LOAD=true SCENARIO=burst k6 inspect infra/keycloak/qa/load.js
```

Inspect/build/lint do not send traffic. Do not execute live scripts as part of
offline verification. `k6` is an external binary and may be skipped with an explicit
note if unavailable. Follow service README for Terraform validation and required
SNS confirmation, WAF commissioning and cross-region recovery evidence.
