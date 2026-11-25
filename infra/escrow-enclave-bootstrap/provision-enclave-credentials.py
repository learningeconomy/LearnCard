"""MFA-operator provisioning. Plaintext travels only in process memory / pipes.

Only ciphertext may reach a temporary file or S3. Python/CLI allocations are not
securely erasable: use a trusted workstation without swap, core dumps or tracing.
AWS retries and CLI history/config/plugins are disabled. Never auto-retry an
ambiguous CreateAccessKey or upload; inspect CloudTrail and use a new generation.
"""
import argparse
import base64
import json
import os
import re
import signal
import subprocess
import sys
import tempfile


class ProvisionError(Exception):
    pass


def aws(args, region, plaintext=None):
    # Require the exported MFA role session from mfa-session.sh. Do not load
    # profiles, CLI plugins or cli_history from the operator's normal config.
    names = ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN")
    if not all(os.environ.get(name) for name in names):
        raise ProvisionError("Export the MFA escrow-kms-admin session first.")
    env = {name: os.environ[name] for name in names}
    env.update(PATH=os.environ.get("PATH", ""), AWS_CONFIG_FILE="/dev/null",
               AWS_SHARED_CREDENTIALS_FILE="/dev/null", BOTO_CONFIG="/dev/null",
               AWS_MAX_ATTEMPTS="1", AWS_RETRY_MODE="standard", AWS_PAGER="",
               AWS_CLI_AUTO_PROMPT="off", AWS_EC2_METADATA_DISABLED="true")
    result = subprocess.run(
        ["aws", *args, "--region", region, "--output", "json", "--no-cli-pager"],
        input=plaintext, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        env=env, check=False,
    )
    if result.returncode:
        # CLI stderr may contain request data. Never propagate it.
        raise ProvisionError("AWS operation failed; outcome may be unknown.")
    if not result.stdout.strip():
        return {}  # Successful IAM DeleteAccessKey has no response document.
    try:
        value = json.loads(result.stdout)
    except (ValueError, UnicodeError):
        raise ProvisionError("Invalid AWS response; outcome may be unknown.") from None
    if not isinstance(value, dict):
        raise ProvisionError("Invalid AWS response; outcome may be unknown.")
    return value


def provision(args):
    for value in (args.tenant, args.generation):
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", value):
            raise ProvisionError("Invalid tenant or generation.")
    match = re.fullmatch(r"arn:aws:kms:([a-z0-9-]+):(\d{12}):key/([0-9a-fA-F-]{36})", args.kms_key_arn)
    if not match or args.kms_key_arn.lower() == args.escrow_kms_key_arn.lower():
        raise ProvisionError("Use a distinct full credential CMK ARN.")
    region, account, _ = match.groups()
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", args.bucket):
        raise ProvisionError("Invalid artifacts bucket.")
    user = f"escrow-enclave-{args.environment}-{args.purpose}"
    principal = f"arn:aws:iam::{account}:user/{user}"
    caller = aws(["sts", "get-caller-identity"], region)
    if caller.get("Account") != account or not isinstance(caller.get("Arn"), str) or not caller["Arn"].startswith(
        f"arn:aws:sts::{account}:assumed-role/escrow-kms-admin/"
    ):
        raise ProvisionError("Caller must be this account's MFA escrow-kms-admin role.")
    key = aws(["kms", "describe-key", "--key-id", args.kms_key_arn], region).get("KeyMetadata", {})
    if (not isinstance(key, dict) or key.get("Arn") != args.kms_key_arn or key.get("KeyState") != "Enabled"
            or key.get("KeyUsage") != "ENCRYPT_DECRYPT" or key.get("KeySpec") != "SYMMETRIC_DEFAULT"):
        raise ProvisionError("Credential CMK is not the expected enabled symmetric key.")
    context = json.dumps({"purpose": args.purpose, "tenant": args.tenant,
                          "environment": args.environment, "authorityGeneration": args.generation,
                          "principalArn": principal}, separators=(",", ":"))
    object_key = f"credentials/{args.purpose}/{args.generation}"
    access_key_id = None
    try:
        created = aws(["iam", "create-access-key", "--user-name", user], "us-east-1").get("AccessKey", {})
        access_key_id = created.get("AccessKeyId")
        secret = created.get("SecretAccessKey", "")
        if (created.get("UserName") != user or created.get("Status") != "Active"
                or not re.fullmatch(r"AKIA[A-Z0-9]{16}", access_key_id or "")
                or not re.fullmatch(r"[A-Za-z0-9/+=]{40}", secret)):
            raise ProvisionError("Unexpected dedicated-key response.")
        plaintext = json.dumps({"accessKeyId": access_key_id, "secretAccessKey": secret,
                                "principalArn": principal}, separators=(",", ":")).encode("ascii")
        sealed = aws(["kms", "encrypt", "--key-id", args.kms_key_arn,
                      "--encryption-context", context, "--plaintext", "fileb:///dev/stdin"], region, plaintext)
        del plaintext, secret, created
        if sealed.get("KeyId") != args.kms_key_arn:
            raise ProvisionError("KMS returned a different key.")
        ciphertext = base64.b64decode(sealed.get("CiphertextBlob", ""), validate=True)
        if not 0 < len(ciphertext) <= 6144:
            raise ProvisionError("Invalid credential ciphertext.")
        # The AWS CLI S3 uploader requires a seekable body. This file contains
        # ONLY ciphertext, never the CreateAccessKey result or plaintext JSON.
        with tempfile.NamedTemporaryFile(prefix="enclave-ciphertext-") as body:
            body.write(ciphertext)
            body.flush()
            aws(["s3api", "put-object", "--bucket", args.bucket, "--key", object_key,
                 "--body", body.name, "--if-none-match", "*",
                 "--content-type", "application/octet-stream"], region)
    except (Exception, KeyboardInterrupt):
        if access_key_id and re.fullmatch(r"AKIA[A-Z0-9]{16}", access_key_id):
            try:
                # Even an ambiguous upload revokes the newly created key. A
                # surviving ciphertext is unusable; never overwrite it to retry.
                aws(["iam", "delete-access-key", "--user-name", user,
                     "--access-key-id", access_key_id], "us-east-1")
            except Exception:
                raise ProvisionError("Provisioning and revocation failed; inspect CloudTrail and revoke new keys before retrying.") from None
        raise ProvisionError("Provisioning failed; inspect CloudTrail for ambiguous key creation/upload before retrying with a new generation.") from None
    return f"s3://{args.bucket}/{object_key}"


def main():
    def terminate(_signum, _frame):
        raise ProvisionError("Interrupted provisioning; inspect CloudTrail.")
    signal.signal(signal.SIGTERM, terminate)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--purpose", required=True, choices=("authority-writer", "email-sender"))
    parser.add_argument("--environment", required=True, choices=("staging", "production"))
    for name in ("tenant", "generation", "kms-key-arn", "escrow-kms-key-arn", "bucket"):
        parser.add_argument(f"--{name}", required=True)
    try:
        print(provision(parser.parse_args()))  # Public ciphertext URI only.
    except (ProvisionError, ValueError, TypeError, KeyError, OSError, KeyboardInterrupt):
        print("Credential provisioning failed. Inspect CloudTrail and revoke any new keys before retrying; no plaintext was written by this tool.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
