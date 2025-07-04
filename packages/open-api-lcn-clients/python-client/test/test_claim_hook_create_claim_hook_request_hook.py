# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.claim_hook_create_claim_hook_request_hook import ClaimHookCreateClaimHookRequestHook

class TestClaimHookCreateClaimHookRequestHook(unittest.TestCase):
    """ClaimHookCreateClaimHookRequestHook unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> ClaimHookCreateClaimHookRequestHook:
        """Test ClaimHookCreateClaimHookRequestHook
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `ClaimHookCreateClaimHookRequestHook`
        """
        model = ClaimHookCreateClaimHookRequestHook()
        if include_optional:
            return ClaimHookCreateClaimHookRequestHook(
                type = 'GRANT_PERMISSIONS',
                data = openapi_client.models.claim_hook_create_claim_hook_request_hook_one_of_1_data.claimHook_createClaimHook_request_hook_oneOf_1_data(
                    claim_uri = '', 
                    target_uri = '', )
            )
        else:
            return ClaimHookCreateClaimHookRequestHook(
                type = 'GRANT_PERMISSIONS',
                data = openapi_client.models.claim_hook_create_claim_hook_request_hook_one_of_1_data.claimHook_createClaimHook_request_hook_oneOf_1_data(
                    claim_uri = '', 
                    target_uri = '', ),
        )
        """

    def testClaimHookCreateClaimHookRequestHook(self):
        """Test ClaimHookCreateClaimHookRequestHook"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
