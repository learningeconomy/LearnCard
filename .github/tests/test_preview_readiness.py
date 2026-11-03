"""Run the real readiness coordinator with controlled time and isolated local I/O."""

import importlib.util
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / ".github/scripts/preview-readiness.py"
SPEC = importlib.util.spec_from_file_location("preview_readiness", SCRIPT)
READY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(READY)
IP = "8.8.8.8"  # Fake coordinator probes only; never contacted by these tests.
KEY = "PRIVATE_FIXTURE_KEY"


def response(state="running", ip=IP):
    return f"State: {state}\nPublic IP: {ip}"


class Clock:
    def __init__(self):
        self.now = 0
        self.sleeps = []

    def __call__(self):
        return self.now

    def sleep(self, seconds):
        self.sleeps.append(seconds)
        self.now += seconds


class Scenario:
    def __init__(self, *, boot_at=0, ip_at=0, ssh_at=0, start_cost=0, body=None):
        self.clock = Clock()
        self.boot_at, self.ip_at, self.ssh_at = boot_at, ip_at, ssh_at
        self.start_cost, self.body = start_cost, body
        self.calls, self.probes, self.logs = [], [], []
        self.start_error = None
        self.start_errors = []
        self.status_errors = []

    def request(self, action, timeout):
        self.calls.append((action, self.clock(), timeout))
        if action == "start":
            self.clock.now += self.start_cost
            if self.start_errors:
                raise self.start_errors.pop(0)
            if self.start_error:
                raise self.start_error
            return "Starting instance"
        if self.status_errors:
            raise self.status_errors.pop(0)
        if self.body:
            return self.body(self.clock())
        return response(
            "running" if self.clock() >= self.boot_at else "pending",
            IP if self.clock() >= self.ip_at else "",
        )

    def probe(self, ip, timeout):
        self.probes.append((ip, self.clock(), timeout))
        if self.clock() >= self.ssh_at:
            return True
        self.clock.now += timeout
        return False

    def run(self, **kwargs):
        return READY.wait_for_ready(
            self, clock=self.clock, sleep=self.clock.sleep, probe=self.probe,
            log=self.logs.append, **kwargs,
        )


class CoordinatorTests(unittest.TestCase):
    def test_warm_instance_returns_immediately(self):
        s = Scenario()
        self.assertEqual(s.run(), IP)
        self.assertEqual([c[0] for c in s.calls], ["start", "status"])
        self.assertEqual(s.clock(), 0)

    def test_ssh_after_old_200_second_window_succeeds(self):
        s = Scenario(ssh_at=240)
        self.assertEqual(s.run(), IP)
        self.assertGreaterEqual(s.clock(), 240)
        self.assertLess(s.clock(), 300)
        self.assertGreater(len(s.probes), 20)

    def test_delayed_boot_and_delayed_ip_then_slow_ssh(self):
        s = Scenario(boot_at=280, ip_at=290, ssh_at=550, start_cost=9)
        self.assertEqual(s.run(), IP)
        self.assertLess(s.clock(), 600)
        self.assertGreaterEqual(s.probes[0][1], 290)

    def test_initial_stopped_status_is_allowed_to_settle(self):
        s = Scenario(body=lambda now: response("stopped" if now < 20 else "running"))
        self.assertEqual(s.run(), IP)
        self.assertEqual(s.clock(), 20)

    def test_running_without_ip_uses_boot_budget(self):
        s = Scenario(ip_at=999)
        with self.assertRaisesRegex(READY.ReadinessError, "EC2 running state"):
            s.run()
        self.assertEqual(s.clock(), 300)
        self.assertEqual(s.probes, [])

    def test_never_boots_fails_with_bounded_requests_and_sleep(self):
        s = Scenario(boot_at=999, start_cost=7)
        with self.assertRaisesRegex(READY.ReadinessError, "EC2 running state"):
            s.run()
        self.assertEqual(s.clock(), 300)
        self.assertTrue(all(t <= min(10, 300 - at) for _, at, t in s.calls))
        self.assertLessEqual(max(s.clock.sleeps), 10)

    def test_never_ssh_fails_after_five_minutes(self):
        s = Scenario(ssh_at=999)
        with self.assertRaisesRegex(READY.ReadinessError, "SSH port 22"):
            s.run()
        self.assertEqual(s.clock(), 300)
        self.assertTrue(all(t <= min(5, 300 - at) for _, at, t in s.probes))

    def test_status_changes_and_ip_changes_do_not_reset_ssh_deadline(self):
        s = Scenario(ssh_at=999, body=lambda now: response(
            "pending" if 50 <= now < 100 else "running",
            "1.1.1.1" if now >= 150 else IP,
        ))
        with self.assertRaisesRegex(READY.ReadinessError, "SSH port 22"):
            s.run()
        self.assertEqual(s.clock(), 300)
        self.assertEqual({p[0] for p in s.probes}, {IP, "1.1.1.1"})
        self.assertFalse(any(50 <= at < 100 for _, at, _ in s.probes))

    def test_returns_latest_ip_only_when_it_is_reachable(self):
        s = Scenario(ssh_at=30, body=lambda now: response(ip=IP if now < 20 else "1.1.1.1"))
        self.assertEqual(s.run(), "1.1.1.1")

    def test_start_consumes_boot_budget(self):
        s = Scenario(start_cost=300)
        with self.assertRaisesRegex(READY.ReadinessError, "EC2 running state"):
            s.run()
        self.assertEqual([c[0] for c in s.calls], ["start"])

    def test_late_successful_status_cannot_pass_deadline(self):
        s = Scenario()
        original = s.request

        def late(action, timeout):
            result = original(action, timeout)
            if action == "status":
                s.clock.now = 300
            return result

        with self.assertRaisesRegex(READY.ReadinessError, "EC2 running state"):
            READY.wait_for_ready(type("Control", (), {"request": staticmethod(late)})(),
                                 clock=s.clock, sleep=s.clock.sleep, probe=s.probe)
        self.assertEqual(s.probes, [])

    def test_late_successful_connect_cannot_pass_deadline(self):
        s = Scenario()

        def late(ip, timeout):
            s.clock.now = 300
            return True

        with self.assertRaisesRegex(READY.ReadinessError, "SSH port 22"):
            READY.wait_for_ready(s, clock=s.clock, sleep=s.clock.sleep, probe=late)

    def test_transient_start_failure_requires_real_readiness(self):
        s = Scenario()
        s.start_error = READY.ControlError("Control API returned HTTP 503.", transient=True)
        self.assertEqual(s.run(), IP)
        self.assertIn("::warning::", s.logs[0])
        s = Scenario(boot_at=999)
        s.start_error = READY.ControlError("Control request timed out.", transient=True)
        with self.assertRaises(READY.ReadinessError):
            s.run()

    def test_lost_start_is_retried_only_after_stopped_status_and_backoff(self):
        s = Scenario()
        s.start_errors = [READY.ControlError("Control request timed out.", transient=True)]
        s.body = lambda now: response(
            "stopped" if sum(c[0] == "start" for c in s.calls) == 1 else "running"
        )
        self.assertEqual(s.run(), IP)
        self.assertEqual([at for action, at, _ in s.calls if action == "start"], [0, 10])
        self.assertEqual(s.clock(), 10)
        self.assertEqual(s.calls[2][0], "status")
        self.assertIn("retrying start", " ".join(s.logs))

    def test_repeated_start_failures_back_off_without_extending_boot_deadline(self):
        s = Scenario(body=lambda now: response("stopped", ""))
        s.start_error = READY.ControlError("Control API returned HTTP 503.", transient=True)
        with self.assertRaisesRegex(READY.ReadinessError, "EC2 running state"):
            s.run()
        self.assertEqual([at for action, at, _ in s.calls if action == "start"],
                         [0, 10, 30, 70, 130, 190, 250])
        self.assertEqual(s.clock(), 300)
        self.assertTrue(all(t <= min(10, 300 - at) for _, at, t in s.calls))
        self.assertEqual(s.probes, [])

    def test_acknowledged_boot_disarms_start_retries_even_after_later_stop(self):
        for state, ip in [("pending", ""), ("running", ""), ("running", IP)]:
            with self.subTest(state=state, ip=ip):
                s = Scenario(ssh_at=999, body=lambda now: response(
                    state if now < 20 else "stopped", ip if now < 20 else ""
                ))
                s.start_error = READY.ControlError("Control request timed out.", transient=True)
                with self.assertRaises(READY.ReadinessError):
                    s.run()
                self.assertEqual(sum(c[0] == "start" for c in s.calls), 1)
                self.assertEqual(s.clock(), 300)

    def test_successful_retry_does_not_restart_again_while_status_settles(self):
        s = Scenario(body=lambda now: response("stopped" if now < 40 else "running"))
        s.start_errors = [READY.ControlError("Control request timed out.", transient=True)]
        self.assertEqual(s.run(), IP)
        self.assertEqual([at for action, at, _ in s.calls if action == "start"], [0, 10])
        self.assertEqual(s.clock(), 40)

    def test_start_is_not_retried_on_status_errors_or_stopping(self):
        for status_errors in (False, True):
            with self.subTest(status_errors=status_errors):
                s = Scenario(body=lambda now: response("stopping", ""))
                s.start_error = READY.ControlError("Control request timed out.", transient=True)
                if status_errors:
                    s.status_errors = [READY.ControlError(
                        "Control API returned HTTP 503.", transient=True
                    ) for _ in range(31)]
                with self.assertRaises(READY.ReadinessError):
                    s.run()
                self.assertEqual(sum(c[0] == "start" for c in s.calls), 1)
                self.assertEqual(s.clock(), 300)

    def test_auth_failure_during_retry_is_fatal(self):
        s = Scenario(body=lambda now: response("stopped", ""))
        s.start_errors = [READY.ControlError("Control request timed out.", transient=True),
                          READY.ControlError("Control API returned HTTP 403.", transient=False)]
        with self.assertRaisesRegex(READY.ControlError, "403"):
            s.run()
        self.assertEqual(s.clock(), 10)
        self.assertEqual(s.probes, [])

    def test_late_retry_cannot_extend_boot_deadline(self):
        for failure in (False, True):
            with self.subTest(failure=failure):
                s = Scenario(body=lambda now: response("stopped", ""))
                s.start_errors = [READY.ControlError("Control request timed out.", transient=True)]
                original = s.request

                def late(action, timeout):
                    result = original(action, timeout)
                    if action == "start":
                        s.clock.now = 300
                        if failure:
                            raise READY.ControlError("Control request timed out.", transient=True)
                    return result

                with self.assertRaisesRegex(READY.ReadinessError, "EC2 running state"):
                    READY.wait_for_ready(type("Control", (), {"request": staticmethod(late)})(),
                                         clock=s.clock, sleep=s.clock.sleep, probe=s.probe,
                                         log=s.logs.append)
                self.assertEqual([at for action, at, _ in s.calls if action == "start"], [0, 10])
                self.assertEqual(s.probes, [])

    def test_transient_status_errors_are_visible_and_recover(self):
        s = Scenario()
        s.status_errors = [READY.ControlError("Control API returned HTTP 429.", transient=True),
                           READY.ControlError("Control request timed out.", transient=True)]
        self.assertEqual(s.run(), IP)
        self.assertEqual(sum("::warning::" in line for line in s.logs), 2)

    def test_auth_failure_never_becomes_a_readiness_timeout(self):
        for action in ("start", "status"):
            with self.subTest(action=action):
                s = Scenario()
                error = READY.ControlError("Control API returned HTTP 403.", transient=False)
                if action == "start":
                    s.start_error = error
                else:
                    s.status_errors = [error]
                with self.assertRaisesRegex(READY.ControlError, "403"):
                    s.run()
                self.assertEqual(s.clock(), 0)
                self.assertEqual(s.probes, [])

    def test_malformed_status_and_unsafe_ip_are_never_probed(self):
        invalid = ["", "Forbidden", response() + "\nState: running", response("unknown"),
                   response(ip="--help"), response(ip="8.8.8.8\nip=attacker"),
                   response(ip="127.0.0.1"), response(ip="0.0.0.0"),
                   response(ip="169.254.169.254"), response(ip="224.0.0.1"),
                   response(ip="10.0.0.1"), response(ip="255.255.255.255"),
                   response(ip="example.com"), response(ip="::1")]
        for body in invalid:
            with self.subTest(body=body):
                s = Scenario(body=lambda now: body)
                with self.assertRaises(READY.ReadinessError):
                    s.run()
                self.assertEqual(s.probes, [])
                self.assertNotIn("attacker", "".join(s.logs))

    def test_terminated_instance_fails_immediately(self):
        for state in ("shutting-down", "terminated"):
            s = Scenario(body=lambda now: response(state))
            with self.assertRaisesRegex(READY.ReadinessError, "terminated"):
                s.run()
            self.assertEqual(s.clock(), 0)


class HttpTests(unittest.TestCase):
    def test_real_curl_has_both_process_and_http_deadlines_and_key_on_stdin(self):
        captured = {}

        def run(args, **kwargs):
            captured.update(args=args, **kwargs)
            return subprocess.CompletedProcess(args, 0, response() + "\n200", "")

        with patch.object(READY.subprocess, "run", side_effect=run):
            self.assertEqual(READY.ControlClient("https://control.invalid", KEY).request("status", 2.5), response())
        self.assertEqual(captured["timeout"], 2.5)
        self.assertNotIn(KEY, json.dumps(captured["args"]))
        self.assertEqual(captured["input"], f"x-api-key: {KEY}\n")
        self.assertNotIn("--location", captured["args"])
        self.assertEqual(captured["args"][captured["args"].index("--max-time") + 1], "2.5")

    def test_hanging_process_is_a_sanitized_transient_failure(self):
        with patch.object(READY.subprocess, "run", side_effect=subprocess.TimeoutExpired(KEY, 1)):
            with self.assertRaises(READY.ControlError) as raised:
                READY.ControlClient("https://control.invalid", KEY).request("start", 1)
        self.assertTrue(raised.exception.transient)
        self.assertNotIn(KEY, str(raised.exception))

    def test_http_classification_and_body_redaction(self):
        for status in (301, 403, 404, 429, 500, 503):
            with self.subTest(status=status):
                result = subprocess.CompletedProcess([], 22, f"{KEY}\n{status}", KEY)
                with patch.object(READY.subprocess, "run", return_value=result):
                    with self.assertRaises(READY.ControlError) as raised:
                        READY.ControlClient("https://control.invalid", KEY).request("status", 1)
                self.assertEqual(raised.exception.transient, status == 429 or status >= 500)
                self.assertNotIn(KEY, str(raised.exception))

    def test_invalid_response_encoding_is_sanitized(self):
        error = UnicodeDecodeError("utf-8", b"\xff", 0, 1, KEY)
        with patch.object(READY.subprocess, "run", side_effect=error):
            with self.assertRaises(READY.ControlError) as raised:
                READY.ControlClient("https://control.invalid", KEY).request("status", 1)
        self.assertFalse(raised.exception.transient)
        self.assertNotIn(KEY, str(raised.exception))

    def test_real_loopback_http_success_auth_redirect_size_and_stall(self):
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_GET(self):
                self.server.headers.append(self.headers.get("x-api-key"))
                if self.path == "/stall/status":
                    time.sleep(2)
                if self.path == "/redirect/status":
                    self.send_response(302)
                    self.send_header("Location", "http://127.0.0.1:1/never-follow")
                    self.end_headers()
                    return
                self.send_response(403 if self.path == "/auth/status" else 200)
                # No Content-Length: exercise the real streamed-body size limit.
                self.end_headers()
                data = b"X" * 2048 if self.path == "/large/status" else response().encode()
                try:
                    self.wfile.write(data)
                except (BrokenPipeError, ConnectionResetError):
                    pass

        with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
            server.headers = []
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            url = f"http://127.0.0.1:{server.server_port}"
            try:
                self.assertEqual(READY.ControlClient(url, KEY).request("status", 1), response())
                for endpoint, expected, transient in (
                    ("auth", "HTTP 403", False), ("redirect", "HTTP 302", False),
                    ("large", "size limit", False), ("stall", "timed out|transport", True),
                ):
                    with self.subTest(endpoint=endpoint):
                        started = time.monotonic()
                        with self.assertRaisesRegex(READY.ControlError, expected) as raised:
                            READY.ControlClient(f"{url}/{endpoint}", KEY).request(
                                "status", 1 if endpoint == "stall" else 5
                            )
                        self.assertEqual(raised.exception.transient, transient)
                        self.assertLess(time.monotonic() - started, 7)
                self.assertTrue(all(header == KEY for header in server.headers))
            finally:
                server.shutdown()
                thread.join(timeout=1)

    def test_real_owned_tcp_listener_and_reserved_nonlistening_port(self):
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
            # Keep the port reserved while checking refusal, so another test/process
            # cannot acquire a released port between our two observations.
            self.assertFalse(READY.ssh_port_reachable("127.0.0.1", 1, port=port))
            listener.listen()
            self.assertTrue(READY.ssh_port_reachable("127.0.0.1", 1, port=port))


class OutputTests(unittest.TestCase):
    def test_only_success_writes_validated_ip(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output"
            env = {"PREVIEW_EC2_LAMBDA_URL": "https://control.invalid", "PREVIEW_EC2_API_KEY": KEY,
                   "GITHUB_OUTPUT": str(output)}
            with patch.dict(os.environ, env), patch.object(READY, "wait_for_ready", return_value=IP):
                READY.main()
            self.assertEqual(output.read_text(), f"ip={IP}\n")
            output.unlink()
            with patch.dict(os.environ, env), patch.object(READY, "wait_for_ready", side_effect=READY.ReadinessError("Timed out.")):
                with self.assertRaises(READY.ReadinessError):
                    READY.main()
            self.assertFalse(output.exists())

    def test_bad_configuration_is_rejected_without_secrets_or_requests(self):
        for url, key in [("http://control.invalid", KEY), ("https://user:pass@control.invalid", KEY),
                         ("https://control.invalid?token=PRIVATE", KEY),
                         ("https://control.invalid:bad", KEY), ("https://control.invalid", KEY + "\r\nInjected: yes")]:
            with self.subTest(url=url):
                result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True,
                    env={**os.environ, "PREVIEW_EC2_LAMBDA_URL": url, "PREVIEW_EC2_API_KEY": key,
                         "GITHUB_OUTPUT": "/must-not-be-written"})
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn(KEY, result.stdout + result.stderr)
                self.assertNotIn("PRIVATE", result.stdout + result.stderr)
                self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
