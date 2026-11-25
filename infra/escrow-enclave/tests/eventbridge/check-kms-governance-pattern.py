#!/usr/bin/env python3
"""Check the escrow_kms_changes event pattern against pinned CloudTrail events.

Uses EventBridge's own matcher (`aws events test-event-pattern`), which reads
no resources, so any credentials work. Pass the deployed rule or a pattern
file (e.g. from `terraform show -json <plan>`):

    check-kms-governance-pattern.py --rule escrow-enclave-staging-kms-governance \
        --environment staging --escrow-key-id <id> --storage-key-id <id>
    check-kms-governance-pattern.py --pattern-file pattern.json ...

Exits nonzero if any case in kms-governance-cases.json matches unexpectedly.
"""
import argparse
import json
import pathlib
import subprocess
import sys

CASES = pathlib.Path(__file__).with_name("kms-governance-cases.json")


def aws(args, region):
    result = subprocess.run(["aws", *args, "--region", region, "--output", "json"],
                            capture_output=True, text=True, check=False)
    if result.returncode:
        sys.exit(f"aws {args[0]} {args[1]} failed: {result.stderr.strip()}")
    return json.loads(result.stdout)


def fill(value, values):
    if isinstance(value, str):
        return value.format(**values)
    if isinstance(value, list):
        return [fill(item, values) for item in value]
    if isinstance(value, dict):
        return {key: fill(item, values) for key, item in value.items()}
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--rule")
    source.add_argument("--pattern-file", type=pathlib.Path)
    parser.add_argument("--environment", required=True, choices=("staging", "production"))
    parser.add_argument("--escrow-key-id", required=True)
    parser.add_argument("--storage-key-id", required=True)
    parser.add_argument("--account", default="123456789012")
    parser.add_argument("--region", default="us-east-1")
    args = parser.parse_args()

    if args.rule:
        pattern = aws(["events", "describe-rule", "--name", args.rule], args.region)["EventPattern"]
    else:
        pattern = args.pattern_file.read_text()
    print(f"pattern: {len(pattern)} characters (default EventBridge quota 2048)")

    key_arn = "arn:aws:kms:{region}:{account}:key/{key}"
    values = {
        "account": args.account,
        "region": args.region,
        "escrow_key_id": args.escrow_key_id,
        "escrow_key_arn": key_arn.format(region=args.region, account=args.account, key=args.escrow_key_id),
        "storage_key_id": args.storage_key_id,
        "storage_key_arn": key_arn.format(region=args.region, account=args.account, key=args.storage_key_id),
        "escrow_alias": f"alias/learncard-escrow-enclave-{args.environment}",
        "storage_alias": f"alias/learncard-escrow-enclave-s3-{args.environment}",
    }

    failures = 0
    for case in json.loads(CASES.read_text())["cases"]:
        identity = {"type": "AssumedRole", "arn": f"arn:aws:sts::{args.account}:assumed-role/test/session"}
        if "invokedBy" in case:
            identity["invokedBy"] = case["invokedBy"]
        detail = {"eventSource": "kms.amazonaws.com", "awsRegion": args.region, "userIdentity": identity}
        detail.update(fill(case["detail"], values))
        event = {
            "id": "00000000-0000-0000-0000-000000000000", "detail-type": "AWS API Call via CloudTrail",
            "source": "aws.kms", "account": args.account, "time": "2026-01-01T00:00:00Z",
            "region": args.region, "resources": [], "detail": detail,
        }
        matched = aws(["events", "test-event-pattern", "--event-pattern", pattern,
                       "--event", json.dumps(event)], args.region)["Result"]
        ok = matched == case["match"]
        failures += not ok
        print(f"{'ok  ' if ok else 'FAIL'} {'pages' if matched else 'quiet'}: {case['name']}")
    print(f"{failures} unexpected result(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
