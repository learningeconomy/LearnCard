"""Validate consumer contracts in an offline export, without initializing the server."""
import json
import os
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Ambiguous duplicate OpenAPI key: {key}")
        result[key] = value
    return result


class ShareDocumentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema_path = os.environ.get("OPENAPI_SCHEMA")
        if not schema_path:
            raise RuntimeError("OPENAPI_SCHEMA must point to an export of checked-out local source")
        # Do not let a last-key-wins parser conceal duplicate owner/public paths.
        cls.document = json.loads(Path(schema_path).read_text(), object_pairs_hook=unique_object)

    def test_owner_and_anonymous_share_contracts_do_not_shadow_each_other(self):
        paths = self.document["paths"]
        owner = paths["/share-links/{id}"]["get"]
        self.assertEqual(owner["security"], [{"Authorization": []}])
        for path in ("/public/share-links/{id}", "/public/share-links/{id}/content"):
            with self.subTest(path=path):
                operation = paths[path]["post"]
                self.assertEqual(operation.get("security", self.document.get("security", [])), [])
                validator = Draft202012Validator(
                    operation["requestBody"]["content"]["application/json"]["schema"]
                )
                for body in ({}, {"passcode": "1234"}, {"passcode": "x" * 64}):
                    self.assertTrue(validator.is_valid(body), body)
                for body in ({"passcode": "123"}, {"passcode": "x" * 65}, {"passcode": None}):
                    self.assertFalse(validator.is_valid(body), body)
        acknowledgement = paths["/public/share-links/acknowledge-view"]["post"]
        self.assertEqual(acknowledgement.get("security", self.document.get("security", [])), [])
        validator = Draft202012Validator(
            acknowledgement["requestBody"]["content"]["application/json"]["schema"]
        )
        self.assertTrue(validator.is_valid({"receipt": "a" * 22}))
        for body in ({}, {"receipt": "a" * 21}, {"receipt": "!" * 22}):
            self.assertFalse(validator.is_valid(body), body)

    def test_owner_list_is_distinct_and_enforces_pagination_bounds(self):
        operation = self.document["paths"]["/share-links"]["get"]
        self.assertEqual(operation["security"], [{"Authorization": []}])
        parameters = {parameter["name"]: parameter for parameter in operation["parameters"]}
        self.assertTrue(all(parameter["in"] == "query" for parameter in parameters.values()))
        limit = Draft202012Validator(parameters["limit"]["schema"])
        for value in (1, 50):
            self.assertTrue(limit.is_valid(value), value)
        for value in (0, 51, 1.5, True, "25"):
            self.assertFalse(limit.is_valid(value), value)
        cursor = Draft202012Validator(parameters["cursor"]["schema"])
        self.assertTrue(cursor.is_valid("x" * 512))
        for value in ("x" * 513, None, 1):
            self.assertFalse(cursor.is_valid(value), value)
