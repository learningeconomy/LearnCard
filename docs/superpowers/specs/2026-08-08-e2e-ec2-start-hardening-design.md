# E2E EC2 Start Hardening Design

## Context

LearnCard release PR run `31219634436` failed before Docker or Playwright. The EC2 start Lambda returned HTTP 500, but `curl -s` exited successfully, so the workflow waited five minutes for an instance that remained stopped and then ran host-dependent diagnostic and cleanup steps with an empty hostname.

The immediately preceding run started the same instance successfully, and no competing E2E run was active. The internal Lambda exception is therefore outside this repository and requires CloudWatch access; this change handles that transient external failure accurately at the workflow boundary.

## Approaches Considered

1. **Bounded retry, fail visibly, and guard host-dependent steps (chosen).** Retry transient start failures a small number of times, preserve the HTTP response body on final failure, and skip SSH/SCP work when no instance IP was established. This improves recovery and removes misleading secondary errors without changing the runner architecture.
2. **Fail fast without retries.** This would report the correct failing step but would make every transient Lambda 5xx require a full workflow rerun.
3. **Fix only the Lambda.** This may remove the underlying exception but requires AWS/CloudWatch access and would still leave the workflow unable to represent future HTTP failures correctly.

## Design

The **Start EC2 instance** step will call the existing `/start` endpoint with curl configured to:

- show response bodies and error details;
- treat HTTP 4xx/5xx responses as failures;
- retry transient HTTP failures up to three times with a five-second delay; and
- stop retrying after a 30-second retry window.

The step will pipe curl's combined output through `tee` into `e2e-artifacts/ec2-start.log` while preserving curl's exit status with Bash `pipefail`. This keeps the final Lambda response visible in both the job log and the diagnostic artifact.

The existing wait loop remains unchanged. Once it confirms SSH readiness, it writes `E2E_EC2_IP` to `GITHUB_ENV` as it does today.

Steps that require SSH or SCP will run only when `E2E_EC2_IP` is non-empty. Artifact upload and summary publication remain unconditional; the start log guarantees the artifact directory is present even when provisioning fails. The `/stop` request remains unconditional because it does not require the public IP and is a safe attempt to restore the shared instance to its expected stopped state.

## Error Handling

- A transient start 5xx that clears within the retry budget proceeds normally.
- A persistent start failure stops at **Start EC2 instance**, with the Lambda response body visible in the log.
- A failure before SSH readiness does not invoke SSH/SCP actions with an empty host.
- The stop request remains unchanged and still runs after failures.

## Verification

A one-off static verification script will parse `.github/workflows/test.yml` and assert the agreed invariants: HTTP failures are surfaced, start retries are bounded, curl's pipeline status is preserved, a start artifact is created, and IP-dependent steps are guarded. The check must fail against the current workflow before the edit and pass afterward. The workflow YAML will also be parsed or linted with an available local tool to catch syntax errors.

## PR Shape

This hardening will be folded directly into `fix/lc-2073-e2e-artifacts` (#1464). The PR is still small, both changes touch the same workflow, and keeping them together avoids an unnecessary stacked PR and merge conflict.
