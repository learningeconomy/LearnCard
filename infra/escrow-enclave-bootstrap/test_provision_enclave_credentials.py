"""Offline: every AWS invocation is replaced, never contacts AWS."""
import argparse
import base64
import importlib.util
import json
import os
import pathlib
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("provision", pathlib.Path(__file__).with_name("provision-enclave-credentials.py"))
assert spec is not None and spec.loader is not None
provision = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provision)


class ProvisionTests(unittest.TestCase):
    def __init__(self, methodName: str = "runTest") -> None:
        super().__init__(methodName)
        self.args = argparse.Namespace()
        self.calls: list[tuple[list[str], str]] = []

    def setUp(self):
        self.args = argparse.Namespace(purpose="authority-writer", environment="staging", tenant="learncard", generation="g1",
            kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/00000000-1111-2222-3333-444444444444",
            escrow_kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            bucket="test-artifacts")
        self.calls = []

    def aws(self, args: list[str], region: str, plaintext: bytes | None = None):
        self.calls.append((args, region))
        self.assertNotIn("a" * 40, " ".join(args))
        op = args[:2]
        if op == ["sts", "get-caller-identity"]:
            return {"Account": "123456789012", "Arn": "arn:aws:sts::123456789012:assumed-role/escrow-kms-admin/test"}
        if op == ["kms", "describe-key"]:
            return {"KeyMetadata": {"Arn": self.args.kms_key_arn, "KeyState": "Enabled", "KeyUsage": "ENCRYPT_DECRYPT", "KeySpec": "SYMMETRIC_DEFAULT"}}
        if op == ["iam", "create-access-key"]:
            return {"AccessKey": {"UserName": f"escrow-enclave-staging-{self.args.purpose}", "Status": "Active", "AccessKeyId": "AKIA0000000000000000", "SecretAccessKey": "a" * 40}}
        if op == ["kms", "encrypt"]:
            assert plaintext is not None
            data = json.loads(plaintext)
            context = json.loads(args[args.index("--encryption-context") + 1])
            self.assertEqual(set(data), {"accessKeyId", "secretAccessKey", "principalArn"})
            self.assertEqual(context, {"purpose": self.args.purpose, "tenant": "learncard", "environment": "staging", "authorityGeneration": "g1", "principalArn": data["principalArn"]})
            self.assertEqual(args[args.index("--plaintext") + 1], "fileb:///dev/stdin")
            return {"KeyId": self.args.kms_key_arn, "CiphertextBlob": base64.b64encode(b"only-ciphertext").decode()}
        if op == ["s3api", "put-object"]:
            self.assertEqual(pathlib.Path(args[args.index("--body") + 1]).read_bytes(), b"only-ciphertext")
            self.assertEqual(args[args.index("--if-none-match") + 1], "*")
            self.assertEqual(args[args.index("--key") + 1], f"credentials/{self.args.purpose}/g1")
            return {}
        if op == ["iam", "delete-access-key"]:
            return {}
        self.fail("Unexpected AWS operation")

    def test_both_purposes_only_upload_ciphertext(self):
        for purpose in ("authority-writer", "email-sender"):
            self.args.purpose = purpose
            with patch.object(provision, "aws", self.aws):
                self.assertEqual(provision.provision(self.args), f"s3://test-artifacts/credentials/{purpose}/g1")

    def test_failed_or_ambiguous_upload_revokes_new_key_without_retry(self):
        def fail_upload(args, region, plaintext=None):
            result = self.aws(args, region, plaintext)
            if args[:2] == ["s3api", "put-object"]:
                raise provision.ProvisionError("ambiguous")
            return result
        with patch.object(provision, "aws", fail_upload), self.assertRaises(provision.ProvisionError):
            provision.provision(self.args)
        self.assertEqual(sum(args[:2] == ["iam", "create-access-key"] for args, _ in self.calls), 1)
        self.assertEqual(self.calls[-1][0][:2], ["iam", "delete-access-key"])

    def test_wrong_caller_never_creates_a_key(self):
        with patch.object(provision, "aws", return_value={"Account": "123456789012", "Arn": "arn:aws:iam::123456789012:root"}) as aws:
            with self.assertRaises(provision.ProvisionError):
                provision.provision(self.args)
            self.assertEqual(aws.call_count, 1)

    def test_wrong_cmk_and_path_fail_before_aws(self):
        self.args.kms_key_arn = self.args.escrow_kms_key_arn
        with patch.object(provision, "aws") as aws, self.assertRaises(provision.ProvisionError):
            provision.provision(self.args)
        aws.assert_not_called()

    def test_invalid_generation_fails_before_aws(self):
        self.args.generation = "../g1"
        with patch.object(provision, "aws") as aws, self.assertRaises(provision.ProvisionError):
            provision.provision(self.args)
        aws.assert_not_called()

    def test_cli_receives_plaintext_only_on_stdin_and_disables_history_and_retries(self):
        with patch.dict(os.environ, {"AWS_ACCESS_KEY_ID": "operator", "AWS_SECRET_ACCESS_KEY": "operator", "AWS_SESSION_TOKEN": "operator", "AWS_PROFILE": "unsafe-profile", "AWS_DATA_PATH": "/unsafe"}), patch.object(provision.subprocess, "run", return_value=types.SimpleNamespace(returncode=0, stdout=b"{}", stderr=b"")) as run:
            provision.aws(["kms", "encrypt", "--plaintext", "fileb:///dev/stdin"], "us-east-1", b"SECRET-PLAINTEXT")
            args, kwargs = run.call_args
            self.assertNotIn("SECRET-PLAINTEXT", " ".join(args[0]))
            self.assertEqual(kwargs["input"], b"SECRET-PLAINTEXT")
            self.assertEqual(kwargs["env"]["AWS_CONFIG_FILE"], "/dev/null")
            self.assertEqual(kwargs["env"]["AWS_SHARED_CREDENTIALS_FILE"], "/dev/null")
            self.assertEqual(kwargs["env"]["AWS_MAX_ATTEMPTS"], "1")
            self.assertNotIn("AWS_PROFILE", kwargs["env"])
            self.assertNotIn("AWS_DATA_PATH", kwargs["env"])

    def test_cli_error_does_not_expose_raw_response(self):
        with patch.dict(os.environ, {"AWS_ACCESS_KEY_ID": "operator", "AWS_SECRET_ACCESS_KEY": "operator", "AWS_SESSION_TOKEN": "operator"}), patch.object(provision.subprocess, "run", return_value=types.SimpleNamespace(returncode=1, stdout=b"SECRET", stderr=b"SECRET")):
            with self.assertRaises(provision.ProvisionError) as error:
                provision.aws(["kms", "encrypt"], "us-east-1")
            self.assertNotIn("SECRET", str(error.exception))

    def test_interruption_after_creation_revokes_key(self):
        def interrupt(args, region, plaintext=None):
            if args[:2] == ["kms", "encrypt"]:
                raise KeyboardInterrupt()
            return self.aws(args, region, plaintext)
        with patch.object(provision, "aws", interrupt), self.assertRaises(provision.ProvisionError):
            provision.provision(self.args)
        self.assertEqual(self.calls[-1][0][:2], ["iam", "delete-access-key"])


if __name__ == "__main__":
    unittest.main()
