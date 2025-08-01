# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_generate_claim_link_request_claim_link_sa import BoostGenerateClaimLinkRequestClaimLinkSA

class TestBoostGenerateClaimLinkRequestClaimLinkSA(unittest.TestCase):
    """BoostGenerateClaimLinkRequestClaimLinkSA unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostGenerateClaimLinkRequestClaimLinkSA:
        """Test BoostGenerateClaimLinkRequestClaimLinkSA
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostGenerateClaimLinkRequestClaimLinkSA`
        """
        model = BoostGenerateClaimLinkRequestClaimLinkSA()
        if include_optional:
            return BoostGenerateClaimLinkRequestClaimLinkSA(
                endpoint = '',
                name = '',
                did = ''
            )
        else:
            return BoostGenerateClaimLinkRequestClaimLinkSA(
                endpoint = '',
                name = '',
        )
        """

    def testBoostGenerateClaimLinkRequestClaimLinkSA(self):
        """Test BoostGenerateClaimLinkRequestClaimLinkSA"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
