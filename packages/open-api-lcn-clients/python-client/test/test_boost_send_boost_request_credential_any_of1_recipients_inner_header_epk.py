# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_send_boost_request_credential_any_of1_recipients_inner_header_epk import BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk

class TestBoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk(unittest.TestCase):
    """BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk:
        """Test BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk`
        """
        model = BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk()
        if include_optional:
            return BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk(
                kty = '',
                crv = '',
                x = '',
                y = '',
                n = '',
                d = ''
            )
        else:
            return BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk(
        )
        """

    def testBoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk(self):
        """Test BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
