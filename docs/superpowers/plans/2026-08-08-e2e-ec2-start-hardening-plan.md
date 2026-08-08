# E2E EC2 Start Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the LearnCard E2E workflow recover from transient EC2 start Lambda failures and avoid SSH/SCP operations when provisioning never produced an IP address.

**Architecture:** Keep the behavior inside the existing GitHub Actions workflow. The start step uses curl's bounded retry and HTTP-failure handling, pipes its output into the existing diagnostic artifact directory while preserving curl's exit code, and host-dependent `always()` steps are conditional on `E2E_EC2_IP`.

**Tech Stack:** GitHub Actions YAML, Bash, curl, Node.js one-off integration verification.

## Global Constraints

-   Modify only `.github/workflows/test.yml` plus the already-approved design and plan documents.
-   Use three retries, a five-second retry delay, and a 30-second retry window.
-   Preserve the Lambda response in both the job log and `e2e-artifacts/ec2-start.log`.
-   Do not change the EC2 wait loop, remote E2E command, diagnostics format, or stop request.
-   Fold the commits into existing PR #1464 (`fix/lc-2073-e2e-artifacts`).

---

### Task 1: Harden EC2 provisioning failure handling

**Files:**

-   Modify: `.github/workflows/test.yml`
-   Create temporarily (do not commit): `/private/tmp/verify-e2e-workflow-hardening.mjs`

**Interfaces:**

-   Consumes: `secrets.E2E_EC2_LAMBDA_URL`, the existing `/start` endpoint, and `E2E_EC2_IP` written by the unchanged readiness loop.
-   Produces: bounded retry behavior, nonzero exit status for persistent HTTP failures, `e2e-artifacts/ec2-start.log`, and guards on the SSH cleanup and SCP diagnostics steps.

-   [ ] **Step 1: Write the failing one-off integration verifier**

Create `/private/tmp/verify-e2e-workflow-hardening.mjs` with the following content using `apply_patch`:

```javascript
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const workflowPath = process.argv[2];
const workflow = await readFile(workflowPath, 'utf8');

const match = workflow.match(
    /            - name: Start EC2 instance\n              run: \|\n([\s\S]*?)(?=\n            - name:)/
);
assert(match, 'Start EC2 instance run block was not found');

const script = match[1]
    .split('\n')
    .map(line => line.replace(/^ {18}/, ''))
    .join('\n');

async function runScenario(statuses) {
    let calls = 0;
    const server = http.createServer((_request, response) => {
        const status = statuses[Math.min(calls, statuses.length - 1)];
        calls += 1;
        response.writeHead(status, { 'content-type': 'text/plain' });
        response.end(
            status === 200 ? 'Starting instance i-test\n' : `Internal Server Error ${calls}\n`
        );
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    const directory = await mkdtemp(path.join(os.tmpdir(), 'e2e-start-'));
    const runnable = script
        .replaceAll('${{ secrets.E2E_EC2_LAMBDA_URL }}', `http://127.0.0.1:${address.port}`)
        .replace('--retry-delay 5', '--retry-delay 0');

    const child = spawn('bash', ['-eu', '-o', 'pipefail', '-c', runnable], { cwd: directory });
    let output = '';
    child.stdout.on('data', chunk => (output += chunk));
    child.stderr.on('data', chunk => (output += chunk));
    const [exitCode] = await once(child, 'close');
    server.close();
    await once(server, 'close');
    let log = '';
    try {
        log = await readFile(path.join(directory, 'e2e-artifacts/ec2-start.log'), 'utf8');
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    return { calls, exitCode, log, output };
}

const transient = await runScenario([500, 500, 200]);
assert.equal(transient.exitCode, 0);
assert.equal(transient.calls, 3);
assert.match(transient.log, /Starting instance i-test/);

const persistent = await runScenario([500]);
assert.notEqual(persistent.exitCode, 0);
assert.equal(persistent.calls, 4);
assert.match(persistent.log, /Internal Server Error 4/);
assert.match(persistent.output, /Internal Server Error 4/);

console.log('E2E workflow hardening behavior verified');
```

-   [ ] **Step 2: Run the verifier and confirm RED**

Run:

```bash
node /private/tmp/verify-e2e-workflow-hardening.mjs .github/workflows/test.yml
```

Expected: FAIL because the transient scenario makes one request instead of three, demonstrating that the current script does not retry HTTP 500 responses.

-   [ ] **Step 3: Implement the minimal workflow change**

Replace the start step body with:

```yaml
run: |
    mkdir -p e2e-artifacts
    set -o pipefail
    echo "Starting EC2 instance..."
    curl --silent --show-error --fail-with-body \
      --retry 3 \
      --retry-delay 5 \
      --retry-max-time 30 \
      "${{ secrets.E2E_EC2_LAMBDA_URL }}/start" 2>&1 \
      | tee e2e-artifacts/ec2-start.log
```

Change both host-dependent `always()` conditions to:

```yaml
if: ${{ always() && env.E2E_EC2_IP != '' }}
```

Apply the condition only to **Cleanup EC2 (docker down, prune)** and **Download E2E diagnostics from EC2**. Do not guard artifact upload, summary publication, or stop.

-   [ ] **Step 4: Run the verifier and confirm GREEN**

Run:

```bash
node /private/tmp/verify-e2e-workflow-hardening.mjs .github/workflows/test.yml
```

Expected: exit 0 and `E2E workflow hardening behavior verified`.

-   [ ] **Step 5: Validate syntax and scope**

Run:

```bash
git diff --check
/Users/donny/Documents/Codex/2026-08-05/i-ha/work/worktrees/lc2073-learncard-phase2a/node_modules/.bin/prettier --check .github/workflows/test.yml
git diff -- .github/workflows/test.yml
```

Expected: both checks exit 0; the diff contains only the start hardening and two IP guards.

-   [ ] **Step 6: Commit the implementation**

```bash
git add .github/workflows/test.yml
git commit -m "ci(e2e): harden EC2 startup failures"
```
