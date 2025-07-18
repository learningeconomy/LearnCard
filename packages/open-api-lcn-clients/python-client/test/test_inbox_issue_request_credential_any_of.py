# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.inbox_issue_request_credential_any_of import InboxIssueRequestCredentialAnyOf

class TestInboxIssueRequestCredentialAnyOf(unittest.TestCase):
    """InboxIssueRequestCredentialAnyOf unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> InboxIssueRequestCredentialAnyOf:
        """Test InboxIssueRequestCredentialAnyOf
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `InboxIssueRequestCredentialAnyOf`
        """
        model = InboxIssueRequestCredentialAnyOf()
        if include_optional:
            return InboxIssueRequestCredentialAnyOf(
                context = [
                    null
                    ],
                id = '',
                type = None,
                issuer = None,
                credential_subject = None,
                refresh_service = None,
                credential_schema = None,
                issuance_date = '',
                expiration_date = '',
                credential_status = None,
                name = '',
                description = '',
                valid_from = '',
                valid_until = '',
                status = None,
                terms_of_use = None,
                evidence = None,
                proof = None,
                verifiable_credential = None,
                holder = ''
            )
        else:
            return InboxIssueRequestCredentialAnyOf(
                context = [
                    null
                    ],
                type = None,
                issuer = None,
                credential_subject = None,
                proof = None,
        )
        """

    def testInboxIssueRequestCredentialAnyOf(self):
        """Test InboxIssueRequestCredentialAnyOf"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
