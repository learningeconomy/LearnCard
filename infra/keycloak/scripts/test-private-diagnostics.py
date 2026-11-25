#!/usr/bin/env python3
# pyright: reportUninitializedInstanceVariable=false
# unittest initializes fresh per-test fixtures in setUp rather than __init__.
"""Offline diagnostics tests. All AWS and Terraform commands are local stubs."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest

REPO = Path(__file__).resolve().parents[3]
SCRIPTS = REPO / "infra/keycloak/scripts"
SECRET = "RAW_SECRET_DIAGNOSTIC_SENTINEL"


class PrivateDiagnosticsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix=".diagnostics-test-", dir=REPO)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.log = self.root / "raw log.txt"
        self.log.write_text(SECRET)
        self.capture = self.root / "capture.json"
        self.env = dict(os.environ, PATH=f"{self.bin}:{os.environ['PATH']}",
                        TF_STATE_BUCKET="private-state-bucket", DEPLOY_ENVIRONMENT="staging",
                        GITHUB_RUN_ID="123", GITHUB_RUN_ATTEMPT="2", AWS_REGION="us-east-1",
                         CAPTURE=str(self.capture), STUB_AWS_STATUS="0", STUB_PLAN_STATUS="0", STUB_SHOW_STATUS="0",
                        GITHUB_STEP_SUMMARY=str(self.root / "summary"),
                        GITHUB_OUTPUT=str(self.root / "output"))
        self.stub("aws", r"""#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
body = pathlib.Path(args[args.index('--body')+1]).read_text()
pathlib.Path(os.environ['CAPTURE']).write_text(json.dumps({'args': args, 'body': body}))
print('RAW_SECRET_DIAGNOSTIC_SENTINEL')
print('RAW_SECRET_DIAGNOSTIC_SENTINEL', file=sys.stderr)
sys.exit(int(os.environ['STUB_AWS_STATUS']))
""")
        self.stub("terraform", r"""#!/usr/bin/env python3
import os, sys
operation = sys.argv[2]
if operation == 'plan':
    print('RAW_SECRET_DIAGNOSTIC_SENTINEL')
    print('RAW_SECRET_DIAGNOSTIC_SENTINEL', file=sys.stderr)
    sys.exit(int(os.environ['STUB_PLAN_STATUS']))
if operation == 'show':
    if os.environ['STUB_SHOW_STATUS'] != '0':
        print('RAW_SECRET_DIAGNOSTIC_SENTINEL', file=sys.stderr)
        sys.exit(int(os.environ['STUB_SHOW_STATUS']))
    print('{"resource_changes": []}')
""")

    def stub(self, name, content):
        path = self.bin / name
        path.write_text(content)
        path.chmod(0o700)

    def helper(self, phase="plan", log=None):
        result = subprocess.run(
            ["bash", "-c", 'set -euo pipefail; source "$1"; upload_private_diagnostics "$2" "$3"',
             "test", str(SCRIPTS / "private-diagnostics.sh"), phase, str(log or self.log)],
            env=self.env, cwd=self.root, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn(SECRET, result.stdout + result.stderr)
        return result

    def test_exact_destination_encryption_and_raw_body(self):
        for phase in ("apply", "plan"):
            for environment in ("staging", "production"):
                with self.subTest(phase=phase, environment=environment):
                    self.env['DEPLOY_ENVIRONMENT'] = environment
                    result = self.helper(phase)
                    captured = json.loads(self.capture.read_text())
                    key = f"keycloak/{environment}/diagnostics/123-2/{phase}.log"
                    self.assertEqual(captured['args'], [
                        's3api', 'put-object', '--bucket', 'private-state-bucket',
                        '--key', key, '--body', str(self.log),
                        '--server-side-encryption', 'AES256', '--cli-connect-timeout', '10',
                        '--cli-read-timeout', '30'])
                    self.assertEqual(captured['body'], SECRET)
                    self.assertIn(f"s3://private-state-bucket/{key}", result.stderr)
                    self.assertEqual(result.stdout, '')

    def test_upload_failure_is_best_effort_and_private(self):
        self.env['STUB_AWS_STATUS'] = '42'
        result = self.helper()
        self.assertIn('upload unavailable:', result.stderr)

    def test_upload_preserves_recovery_budget(self):
        self.env['DEPLOY_DEADLINE_EPOCH'] = str(int(time.time()) + 600)
        result = self.helper()
        self.assertFalse(self.capture.exists())
        self.assertIn('upload unavailable:', result.stderr)

    def test_absolute_deadline_kills_unresponsive_process(self):
        self.stub('aws', '#!/usr/bin/env python3\nimport signal, time\nsignal.signal(signal.SIGTERM, signal.SIG_IGN)\ntime.sleep(60)\n')
        self.env['DEPLOY_DEADLINE_EPOCH'] = str(int(time.time()) + 662)
        start = time.monotonic()
        result = self.helper()
        self.assertLess(time.monotonic() - start, 6)
        self.assertIn('upload unavailable:', result.stderr)

    def test_missing_aws_is_best_effort(self):
        (self.bin / 'aws').write_text('#!/bin/sh\nexit 127\n')
        self.helper()

    def test_invalid_context_does_not_upload(self):
        for name in ('GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT', 'TF_STATE_BUCKET', 'DEPLOY_ENVIRONMENT'):
            for value in ('', '../escape', 'invalid\nRAW_SECRET_DIAGNOSTIC_SENTINEL'):
                with self.subTest(name=name, value=value):
                    original = self.env[name]
                    self.env[name] = value
                    result = self.helper()
                    self.assertFalse(self.capture.exists())
                    self.assertEqual(result.stdout + result.stderr, '')
                    self.env[name] = original

    def test_missing_log_and_invalid_phase_do_not_upload(self):
        self.helper(log=self.root / 'absent')
        self.helper(phase='init')
        self.assertFalse(self.capture.exists())

    def plan(self, status, upload_status='0'):
        directory = self.root / 'infra/keycloak/terraform/service'
        directory.mkdir(parents=True)
        self.env.update(STUB_PLAN_STATUS=str(status), STUB_AWS_STATUS=upload_status)
        result = subprocess.run(['bash', str(SCRIPTS / 'terraform-plan.sh'), 'service'],
                                cwd=self.root, env=self.env, text=True, capture_output=True)
        self.assertNotIn(SECRET, result.stdout + result.stderr)
        return result

    def test_failed_plan_uploads_raw_log(self):
        result = self.plan(1)
        self.assertEqual(result.returncode, 1)
        self.assertIn(SECRET, json.loads(self.capture.read_text())['body'])

    def test_failed_plan_retains_failure_if_upload_fails(self):
        result = self.plan(1, '42')
        self.assertEqual(result.returncode, 1)
        self.assertIn('upload unavailable:', result.stderr)

    def test_failed_plan_inspection_is_private(self):
        self.env['STUB_SHOW_STATUS'] = '1'
        result = self.plan(0)
        self.assertEqual(result.returncode, 1)
        self.assertIn(SECRET, json.loads(self.capture.read_text())['body'])

    def test_successful_plan_does_not_upload(self):
        result = self.plan(0)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.capture.exists())
        self.assertIn('create: 0, update: 0, delete: 0', result.stdout)

    def test_bootstrap_scoping_and_retention_contract(self):
        bootstrap = REPO / 'infra/aws/bootstrap'
        for file in ('deploy-pipeline.tf', 'plan-read.tf'):
            text = (bootstrap / file).read_text()
            statement = text.split('sid       = "WritePrivateDiagnostics"', 1)[1].split('\n  }', 1)[0]
            self.assertIn('actions   = ["s3:PutObject"]', statement)
            self.assertIn('${aws_s3_bucket.state.arn}/keycloak/${var.environment}/diagnostics/*', statement)
            self.assertIn('values   = ["AES256"]', statement)
            self.assertNotIn('s3:GetObject', statement)
        state = (bootstrap / 'state.tf').read_text()
        self.assertIn('sse_algorithm = "AES256"', state)
        rule = state.split('id     = "expire-private-diagnostics-after-30-days"')[1].split('\n  rule {')[0]
        self.assertIn('prefix = "keycloak/${var.environment}/diagnostics/"', rule)
        self.assertNotIn('*', rule)
        self.assertIn('days = 30', rule)
        self.assertIn('noncurrent_days = 30', rule)


if __name__ == '__main__':
    unittest.main()
