import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = join(dirname(fileURLToPath(import.meta.url)), 'reject-vulnerable-ecr-image.sh');

const stubAws = `#!/usr/bin/env bash
set -euo pipefail
log="\${AWS_STUB_LOG:?}"
printf '%s\\n' "\$*" >> "\$log"
mode="\${AWS_STUB_MODE:?}"

if [[ "\$1" == "ecr" && "\$2" == "start-image-scan" ]]; then
  case "\$mode" in
    start-then-clean|findings-high)
      echo '{"imageScanStatus":{"status":"IN_PROGRESS"}}'
      exit 0
      ;;
    already-in-progress)
      echo "An error occurred (LimitExceededException) when calling the StartImageScan operation: The scan could not be started as another scan is already in progress" >&2
      exit 1
      ;;
    enhanced)
      echo "An error occurred (ValidationException) when calling the StartImageScan operation: This action is not supported when enhanced scanning is enabled" >&2
      exit 1
      ;;
    access-denied)
      echo "An error occurred (AccessDeniedException) when calling the StartImageScan operation: User is not authorized to perform ecr:StartImageScan" >&2
      exit 1
      ;;
    *)
      echo "unexpected start mode: \$mode" >&2
      exit 99
      ;;
  esac
fi

if [[ "\$1" == "ecr" && "\$2" == "wait" ]]; then
  case "\$mode" in
    access-denied)
      echo "wait should not run after a hard start-image-scan failure" >&2
      exit 1
      ;;
    *)
      exit 0
      ;;
  esac
fi

if [[ "\$1" == "ecr" && "\$2" == "describe-image-scan-findings" ]]; then
  case "\$mode" in
    findings-high)
      echo '{"CRITICAL":1,"HIGH":2}'
      exit 0
      ;;
    *)
      echo '{}'
      exit 0
      ;;
  esac
fi

echo "unexpected aws invocation: \$*" >&2
exit 99
`

const runGate = mode => {
    const dir = mkdtempSync(join(tmpdir(), 'ecr-gate-'));
    const awsPath = join(dir, 'aws');
    const logPath = join(dir, 'aws.log');
    writeFileSync(awsPath, stubAws);
    chmodSync(awsPath, 0o755);
    writeFileSync(logPath, '');

    const result = spawnSync(
        script,
        ['--repository-name', 'learncard-ai-agent-staging', '--digest', 'sha256:testdigest'],
        {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${dir}:${process.env.PATH}`,
                AWS_STUB_MODE: mode,
                AWS_STUB_LOG: logPath,
            },
        }
    );

    const calls = readFileSync(logPath, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean);

    return { status: result.status, stdout: result.stdout, stderr: result.stderr, calls };
};

test('starts a missing scan and passes when findings are clean', () => {
    const result = runGate('start-then-clean');
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.calls[0] ?? '', /ecr start-image-scan/);
    assert.match(result.calls[1] ?? '', /ecr wait image-scan-complete/);
    assert.match(result.calls[2] ?? '', /ecr describe-image-scan-findings/);
    assert.match(result.stdout, /no critical or high findings/);
});

test('fails when the completed scan has critical or high findings', () => {
    const result = runGate('findings-high');
    assert.equal(result.status, 1);
    assert.match(result.stdout, /1 critical and 2 high findings/);
    assert.equal(result.calls.length, 3);
});

test('continues to wait when start-image-scan says a scan is already in progress', () => {
    const result = runGate('already-in-progress');
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /existing or in-progress scan/);
    assert.match(result.calls[0] ?? '', /ecr start-image-scan/);
    assert.match(result.calls[1] ?? '', /ecr wait image-scan-complete/);
});

test('continues to wait when start-image-scan is unsupported because of Enhanced scanning', () => {
    const result = runGate('enhanced');
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /Enhanced\/Inspector scanning/);
    assert.match(result.calls[1] ?? '', /ecr wait image-scan-complete/);
});

test('fails clearly when the deploy role cannot start a scan', () => {
    const result = runGate('access-denied');
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Could not start an ECR image scan/);
    assert.match(result.stdout, /ecr:StartImageScan/);
    assert.equal(result.calls.length, 1);
    assert.match(result.calls[0] ?? '', /ecr start-image-scan/);
});
