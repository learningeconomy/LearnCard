# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.auth_grants_get_auth_grants_request import AuthGrantsGetAuthGrantsRequest

class TestAuthGrantsGetAuthGrantsRequest(unittest.TestCase):
    """AuthGrantsGetAuthGrantsRequest unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> AuthGrantsGetAuthGrantsRequest:
        """Test AuthGrantsGetAuthGrantsRequest
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `AuthGrantsGetAuthGrantsRequest`
        """
        model = AuthGrantsGetAuthGrantsRequest()
        if include_optional:
            return AuthGrantsGetAuthGrantsRequest(
                limit = 1.337,
                cursor = '',
                query = openapi_client.models.auth_grants_get_auth_grants_request_query.authGrants_getAuthGrants_request_query(
                    id = null, 
                    name = null, 
                    description = null, 
                    status = 'active', )
            )
        else:
            return AuthGrantsGetAuthGrantsRequest(
        )
        """

    def testAuthGrantsGetAuthGrantsRequest(self):
        """Test AuthGrantsGetAuthGrantsRequest"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
