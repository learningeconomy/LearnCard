"""Exercise generated public APIs against a loopback-only synthetic HTTP receiver."""
import copy
import json
import os
import sys
import threading
import unittest
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from jsonschema import Draft202012Validator, FormatChecker

PACKAGE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE / "python-client"))

from openapi_client import ApiClient, Configuration
from openapi_client.api.activity_api import ActivityApi
from openapi_client.api.credential_refresh_api import CredentialRefreshApi
from openapi_client.models.credential_refresh_allocate_credential_refresh_request import (
    CredentialRefreshAllocateCredentialRefreshRequest as Allocate,
)
from openapi_client.models.credential_refresh_publish_credential_refresh_request import (
    CredentialRefreshPublishCredentialRefreshRequest as Publish,
)

UNSIGNED = {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    "id": "urn:uuid:synthetic-credential",
    "type": ["VerifiableCredential", "SyntheticCredential"],
    "issuer": "did:example:synthetic-issuer",
    "credentialSubject": {
        "id": "did:example:synthetic-holder",
        "syntheticClaims": {"score": 0, "enabled": False, "note": None, "tags": ["offline"]},
    },
    "credentialStatus": {
        "id": "https://example.invalid/synthetic-status",
        "type": "SyntheticStatus",
        "statusListIndex": "0",
    },
}
SIGNED = {
    **UNSIGNED,
    "proof": {
        "type": "DataIntegrityProof",
        "created": "2026-01-02T00:00:00Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:example:synthetic-issuer#key-1",
        "jws": "synthetic-offline-signature",
    },
}
COMMON = {
    "refreshId": "synthetic-refresh",
    "notifyHolder": False,
    "updateSummary": "",
    "idempotencyKey": "synthetic-idempotency",
}
PUBLICATIONS = {
    "issuer-signed": {**COMMON, "mode": "issuer-signed", "signedCredential": SIGNED},
    "signing-authority": {
        **COMMON,
        "mode": "signing-authority",
        "credential": UNSIGNED,
        "signingAuthority": {
            "type": "SyntheticSigningAuthority",
            "options": {"synthetic": True, "key": "offline"},
        },
    },
}


class ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema_path = os.environ.get("OPENAPI_SCHEMA")
        if not schema_path:
            raise RuntimeError("OPENAPI_SCHEMA must point to an export of checked-out local source")
        cls.document = json.loads(Path(schema_path).read_text())
        cls.records = []

        class Receiver(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def do_POST(self):
                self.receive()

            def do_GET(self):
                self.receive()

            def receive(self):
                raw_body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
                body = json.loads(raw_body) if raw_body else None
                cls.records.append({
                    "method": self.command,
                    "path": self.path,
                    "body": body,
                    "contentType": self.headers.get("Content-Type"),
                })
                if urlsplit(self.path).path == "/credential-refresh/allocate":
                    response = {
                        "refreshId": "synthetic-refresh",
                        "refreshService": {
                            "id": "https://example.invalid/synthetic-refresh",
                            "type": "LearnCardCredentialRefresh2026",
                            "authorization": {"type": "LearnCardDIDAuth"},
                        },
                    }
                elif urlsplit(self.path).path == "/credential-refresh/publish":
                    response = {
                        "refreshId": "synthetic-refresh", "version": 2,
                        "publishedAt": "2026-01-02T00:00:00Z", "notification": "suppressed",
                    }
                else:
                    response = {}
                encoded = json.dumps(response).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)

        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Receiver)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.client = ApiClient(Configuration(host=f"http://127.0.0.1:{cls.server.server_port}"))
        cls.refresh = CredentialRefreshApi(cls.client)
        cls.activity = ActivityApi(cls.client)

    @classmethod
    def tearDownClass(cls):
        cls.client.rest_client.pool_manager.clear()
        cls.server.shutdown()
        cls.thread.join(timeout=5)
        cls.server.server_close()
        capture = os.environ.get("CLIENT_CONTRACT_CAPTURE")
        if capture:
            Path(capture).write_text(json.dumps(cls.records, indent=2) + "\n")

    def body_validator(self, path):
        schema = self.document["paths"][path]["post"]["requestBody"]["content"]["application/json"]["schema"]
        return Draft202012Validator(schema, format_checker=FormatChecker())

    def last_record(self, valid=True):
        record = self.records[-1]
        record["serverValid"] = valid
        return record

    def test_publication_preserves_complete_prepared_json_for_both_construction_paths(self):
        validator = self.body_validator("/credential-refresh/publish")
        for mode, payload in PUBLICATIONS.items():
            for constructor in (Publish.from_dict, Publish.model_validate):
                with self.subTest(mode=mode, constructor=constructor.__name__):
                    model = constructor(copy.deepcopy(payload))
                    self.refresh.credential_refresh_publish_credential_refresh(model, _request_timeout=2.0)
                    record = self.last_record()
                    self.assertEqual(record["method"], "POST")
                    self.assertEqual(record["path"], "/credential-refresh/publish")
                    self.assertEqual(record["contentType"], "application/json")
                    self.assertEqual(record["body"], payload)
                    validator.validate(record["body"])

    def test_publication_without_optional_fields_does_not_invent_nulls(self):
        for mode, full in PUBLICATIONS.items():
            payload = {key: value for key, value in full.items() if key not in ("notifyHolder", "updateSummary", "idempotencyKey")}
            for constructor in (Publish.from_dict, Publish.model_validate):
                with self.subTest(mode=mode, constructor=constructor.__name__):
                    self.refresh.credential_refresh_publish_credential_refresh(constructor(payload), _request_timeout=2.0)
                    record = self.last_record()
                    self.assertEqual(record["body"], payload)
                    self.body_validator("/credential-refresh/publish").validate(record["body"])

    def test_mixed_unknown_modes_and_missing_required_fields_are_rejected_before_transport(self):
        invalid = [
            {**PUBLICATIONS["issuer-signed"], "credential": UNSIGNED},
            {**PUBLICATIONS["issuer-signed"], "signingAuthority": {"type": "Synthetic"}},
            {**PUBLICATIONS["issuer-signed"], "credential": UNSIGNED, "signingAuthority": {"type": "Synthetic"}},
            {**PUBLICATIONS["signing-authority"], "signedCredential": SIGNED},
            {**PUBLICATIONS["issuer-signed"], "mode": "unknown"},
            {**PUBLICATIONS["issuer-signed"], "mode": None},
        ]
        for mode, payload in PUBLICATIONS.items():
            required = ["mode", "refreshId", "signedCredential"] if mode == "issuer-signed" else ["mode", "refreshId", "credential", "signingAuthority"]
            for field in required:
                missing = copy.deepcopy(payload)
                del missing[field]
                invalid.append(missing)
        validator = self.body_validator("/credential-refresh/publish")
        for index, payload in enumerate(invalid):
            self.assertFalse(validator.is_valid(payload))
            for constructor in (Publish.from_dict, Publish.model_validate):
                with self.subTest(case=index, constructor=constructor.__name__):
                    before = len(self.records)
                    with self.assertRaises(ValueError):
                        self.refresh.credential_refresh_publish_credential_refresh(constructor(copy.deepcopy(payload)), _request_timeout=2.0)
                    self.assertEqual(len(self.records), before, "Invalid input must not reach HTTP transport")
        self.records.extend({"method": "VALIDATE", "path": "/credential-refresh/publish", "body": payload, "serverValid": False} for payload in invalid)

    def test_allocation_missing_string_and_explicit_null_remain_distinct(self):
        validator = self.body_validator("/credential-refresh/allocate")
        for profile in ({}, {"profileId": "synthetic-profile"}, {"profileId": None}):
            payload = {"credentialId": "urn:uuid:synthetic-credential", "holder": {"did": "did:example:synthetic-holder", **profile}}
            for constructor in (Allocate.from_dict, Allocate.model_validate):
                with self.subTest(profile=profile, constructor=constructor.__name__):
                    self.refresh.credential_refresh_allocate_credential_refresh(constructor(copy.deepcopy(payload)), _request_timeout=2.0)
                    valid = profile.get("profileId", "missing") is not None
                    record = self.last_record(valid)
                    self.assertEqual(record["body"], payload)
                    self.assertEqual(validator.is_valid(record["body"]), valid)
                    # Explicit null is preserved, not made valid: the unchanged server rejects it.
                    if "profileId" not in profile:
                        self.assertNotIn("profileId", record["body"]["holder"])

    def test_aware_activity_dates_normalize_to_exact_utc_z_queries(self):
        cases = [
            (timezone.utc, "2026-01-02T03:04:05.123456Z", "2026-01-02T03%3A04%3A05.123456Z"),
            (timezone(timedelta(hours=5, minutes=30)), "2026-01-01T21:34:05.123456Z", "2026-01-01T21%3A34%3A05.123456Z"),
            (timezone(timedelta(hours=-7)), "2026-01-02T10:04:05.123456Z", "2026-01-02T10%3A04%3A05.123456Z"),
        ]
        for method in (self.activity.activity_get_my_activities_without_preload_content, self.activity.activity_get_activity_stats_without_preload_content):
            for zone, expected_start, encoded_start in cases:
                with self.subTest(method=method.__name__, zone=zone):
                    response = method(start_date=datetime(2026, 1, 2, 3, 4, 5, 123456, tzinfo=zone), end_date=datetime(2026, 1, 3, tzinfo=timezone.utc), _request_timeout=2.0)
                    response.read()
                    record = self.last_record()
                    parsed = urlsplit(record["path"])
                    self.assertEqual(parsed.query, f"startDate={encoded_start}&endDate=2026-01-03T00%3A00%3A00Z")
                    query = {key: values[0] for key, values in parse_qs(parsed.query).items()}
                    self.assertEqual(query, {"startDate": expected_start, "endDate": "2026-01-03T00:00:00Z"})
                    for parameter in self.document["paths"][parsed.path]["get"]["parameters"]:
                        if parameter.get("name") in query:
                            Draft202012Validator(parameter["schema"], format_checker=FormatChecker()).validate(query[parameter["name"]])

    def test_naive_activity_dates_fail_before_transport_for_either_filter(self):
        for method in (self.activity.activity_get_my_activities_without_preload_content, self.activity.activity_get_activity_stats_without_preload_content):
            for field in ("start_date", "end_date"):
                with self.subTest(method=method.__name__, field=field):
                    before = len(self.records)
                    with self.assertRaisesRegex(ValueError, "must include a timezone"):
                        method(**{field: datetime(2026, 1, 2)}, _request_timeout=2.0)
                    self.assertEqual(len(self.records), before)

    def test_omitted_activity_dates_are_not_added_to_query(self):
        for method in (self.activity.activity_get_my_activities_without_preload_content, self.activity.activity_get_activity_stats_without_preload_content):
            response = method(_request_timeout=2.0)
            response.read()
            self.assertEqual(urlsplit(self.last_record()["path"]).query, "")


    def test_exported_skill_search_accepts_regex_strings_but_not_numeric_regexes(self):
        validator = self.body_validator("/boost/skills/search")
        payload = {"uri": "urn:synthetic:boost", "query": {"statement": {"$regex": "^synthetic"}}, "limit": 25}
        validator.validate(payload)
        invalid = copy.deepcopy(payload)
        invalid["query"]["statement"]["$regex"] = 123
        self.assertFalse(validator.is_valid(invalid))

    def test_unified_send_export_preserves_the_complete_managed_receipt_contract(self):
        schema = self.document["paths"]["/send"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        receipt = {
            "refreshId": "synthetic-refresh",
            "refreshService": {
                "id": "https://example.invalid/synthetic-refresh",
                "type": "LearnCardCredentialRefresh2026",
                "authorization": {"type": "LearnCardDIDAuth"},
            },
            "credentialId": "urn:uuid:synthetic-credential",
            "issuerDid": "did:example:synthetic-issuer",
            "holderDid": "did:example:synthetic-holder",
            "credentialStatus": UNSIGNED["credentialStatus"],
        }
        response = {
            "type": "boost", "uri": "https://example.invalid/boost/synthetic",
            "credentialUri": "https://example.invalid/credential/synthetic",
            "activityId": "synthetic-activity", "refresh": receipt,
        }
        validator.validate(response)
        for field in ("refreshId", "credentialId", "issuerDid", "holderDid"):
            invalid = copy.deepcopy(response)
            del invalid["refresh"][field]
            self.assertFalse(validator.is_valid(invalid))


if __name__ == "__main__":
    unittest.main(verbosity=2)
