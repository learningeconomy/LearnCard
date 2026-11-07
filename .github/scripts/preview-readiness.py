#!/usr/bin/env python3
"""Bound preview startup and TCP/22 readiness without exposing control credentials."""

import ipaddress
import os
import re
import socket
import subprocess
import sys
import time
from urllib.parse import urlsplit


class ReadinessError(Exception):
    """An allowlisted diagnostic that is safe to put in Actions logs."""


class ControlError(ReadinessError):
    def __init__(self, message, *, transient):
        super().__init__(message)
        self.transient = transient


def bounded_seconds(value, maximum):
    return (isinstance(value, (int, float)) and not isinstance(value, bool)
            and 0 < value <= maximum)


class ControlClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def request(self, action, timeout):
        if action not in ("start", "status") or not bounded_seconds(timeout, 10):
            raise ControlError("Invalid control request action or timeout.", transient=False)
        try:
            result = subprocess.run(
                [
                    "curl", "--silent", "--show-error", "--fail",
                    "--connect-timeout", str(min(5, timeout)),
                    # curl >=8.4 also bounds transfers without Content-Length.
                    "--max-time", str(timeout), "--max-filesize", "1024",
                    "--header", "@-", "--write-out", "\n%{http_code}",
                    "--", f"{self.base_url}/{action}",
                ],
                # Keep the API key out of process arguments as well as logs.
                input=f"x-api-key: {self.api_key}\n",
                capture_output=True, text=True, timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            raise ControlError("Control request timed out.", transient=True) from None
        except OSError:
            raise ControlError("Could not start the control HTTP client.", transient=False) from None
        except UnicodeError:
            raise ControlError("Control response was not valid text.", transient=False) from None

        body, separator, status = result.stdout.rpartition("\n")
        code = int(status) if separator and re.fullmatch(r"[0-9]{3}", status) else 0
        if code >= 300:
            raise ControlError(
                f"Control API returned HTTP {code}.",
                transient=code == 429 or code >= 500,
            )
        if result.returncode == 63:
            raise ControlError("Control response exceeded its size limit.", transient=False)
        if result.returncode != 0 or not 200 <= code < 300:
            raise ControlError("Control request failed in transport.", transient=True)
        return body


def parse_status(body):
    lines = body.splitlines()
    if len(lines) != 2:
        raise ReadinessError("Control API returned an invalid status response.")
    state = re.fullmatch(r"State: ([a-z-]+)", lines[0])
    address = re.fullmatch(r"Public IP: ?(.*)", lines[1])
    if not state or not address:
        raise ReadinessError("Control API returned an invalid status response.")
    state = state[1]
    if state not in ("pending", "running", "stopped", "stopping", "shutting-down", "terminated"):
        raise ReadinessError("Control API returned an unexpected instance state.")
    ip = address[1]
    if ip:
        try:
            address = ipaddress.IPv4Address(ip)
            if not address.is_global or address.is_multicast or address.is_reserved:
                raise ipaddress.AddressValueError
            ip = str(address)
        except ipaddress.AddressValueError:
            raise ReadinessError("Control API returned an invalid IPv4 address.") from None
    return state, ip


def ssh_port_reachable(ip, timeout, *, port=22):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except OSError:
        return False


def wait_for_ready(control, *, clock=time.monotonic, sleep=time.sleep,
                   probe=ssh_port_reachable, log=print, boot_seconds=300, ssh_seconds=300):
    """A boot budget followed by an SSH budget, both within one fixed overall deadline."""
    if not bounded_seconds(boot_seconds, 300) or not bounded_seconds(ssh_seconds, 300):
        raise ReadinessError("Invalid readiness time budgets.")
    started = clock()
    boot_deadline = started + boot_seconds
    overall_deadline = boot_deadline + ssh_seconds
    ssh_deadline = None
    retry_start = False
    next_start_at = started
    start_backoff = 10

    def remaining():
        deadline = min(overall_deadline, ssh_deadline or boot_deadline)
        left = deadline - clock()
        if left <= 0:
            if ssh_deadline is None:
                raise ReadinessError("Timed out waiting for EC2 running state and a valid IP.")
            raise ReadinessError("Timed out waiting for SSH port 22.")
        return left

    def request_start():
        nonlocal retry_start, next_start_at, start_backoff
        try:
            control.request("start", min(10, remaining()))
            remaining()
            retry_start = False
        except ControlError as error:
            if not error.transient:
                raise
            remaining()
            # The request may have been lost or accepted despite its response failing.
            # A fresh stopped status is required before another start is attempted.
            retry_start = True
            next_start_at = clock() + start_backoff
            start_backoff = min(60, start_backoff * 2)
            log(f"::warning::{error} Checking actual instance readiness.")

    request_start()

    while True:
        try:
            body = control.request("status", min(10, remaining()))
            remaining()  # A response arriving at/after the deadline cannot turn it green.
            state, ip = parse_status(body)
            if state in ("shutting-down", "terminated"):
                raise ReadinessError("Preview instance is shutting down or terminated.")
            if state in ("pending", "running"):
                # Once boot is acknowledged, never turn a later stop into a restart loop.
                retry_start = False
            if (state == "stopped" and retry_start and ssh_deadline is None
                    and clock() >= next_start_at):
                log("Instance is stopped after a transient start failure; retrying start.")
                request_start()
                continue
            if state == "running" and ip:
                if ssh_deadline is None:
                    ssh_deadline = min(overall_deadline, clock() + ssh_seconds)
                    log("EC2 is running; waiting for SSH port 22.")
                reachable = probe(ip, min(5, remaining()))
                remaining()  # Include connect time, not only the number of probes.
                if reachable:
                    log("SSH port 22 is reachable.")
                    return ip
            else:
                log(f"Waiting for instance readiness; state={state}.")
        except ControlError as error:
            if not error.transient:
                raise
            log(f"::warning::{error} Retrying within the readiness deadline.")
        # Re-read state/IP on every iteration; an IP change never resets the SSH budget.
        sleep(min(5 if ssh_deadline is not None else 10, remaining()))


def main():
    base_url = os.environ.get("PREVIEW_EC2_LAMBDA_URL", "")
    api_key = os.environ.get("PREVIEW_EC2_API_KEY", "")
    output = os.environ.get("GITHUB_OUTPUT", "")
    try:
        parsed = urlsplit(base_url)
        parsed.port  # Validate a supplied port before making a control request.
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username is not None
                or parsed.password is not None or parsed.query or parsed.fragment
                or any(character.isspace() for character in base_url)):
            raise ValueError
        if not api_key or "\r" in api_key or "\n" in api_key or not output:
            raise ValueError
    except ValueError:
        raise ReadinessError("Preview control URL, API key or workflow output is not configured correctly.") from None

    ip = wait_for_ready(ControlClient(base_url, api_key), log=lambda message: print(message, flush=True))
    # Only a parsed address proven reachable before the deadline reaches downstream SSH.
    with open(output, "a", encoding="utf-8") as destination:
        destination.write(f"ip={ip}\n")


if __name__ == "__main__":
    try:
        main()
    except ReadinessError as error:
        print(f"::error::{error}", file=sys.stderr)
        sys.exit(1)
    except OSError:
        print("::error::Could not complete preview readiness or write its output.", file=sys.stderr)
        sys.exit(1)
