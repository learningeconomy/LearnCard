# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_send_boost_request_credential_any_of1 import BoostSendBoostRequestCredentialAnyOf1

class TestBoostSendBoostRequestCredentialAnyOf1(unittest.TestCase):
    """BoostSendBoostRequestCredentialAnyOf1 unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostSendBoostRequestCredentialAnyOf1:
        """Test BoostSendBoostRequestCredentialAnyOf1
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostSendBoostRequestCredentialAnyOf1`
        """
        model = BoostSendBoostRequestCredentialAnyOf1()
        if include_optional:
            return BoostSendBoostRequestCredentialAnyOf1(
                protected = '',
                iv = '',
                ciphertext = '',
                tag = '',
                aad = '',
                recipients = [
                    openapi_client.models.boost_send_boost_request_credential_any_of_1_recipients_inner.boost_sendBoost_request_credential_anyOf_1_recipients_inner(
                        header = openapi_client.models.boost_send_boost_request_credential_any_of_1_recipients_inner_header.boost_sendBoost_request_credential_anyOf_1_recipients_inner_header(
                            alg = '', 
                            iv = '', 
                            tag = '', 
                            epk = openapi_client.models.boost_send_boost_request_credential_any_of_1_recipients_inner_header_epk.boost_sendBoost_request_credential_anyOf_1_recipients_inner_header_epk(
                                kty = '', 
                                crv = '', 
                                x = '', 
                                y = '', 
                                n = '', 
                                d = '', ), 
                            kid = '', 
                            apv = '', 
                            apu = '', ), 
                        encrypted_key = '', )
                    ]
            )
        else:
            return BoostSendBoostRequestCredentialAnyOf1(
                protected = '',
                iv = '',
                ciphertext = '',
                tag = '',
        )
        """

    def testBoostSendBoostRequestCredentialAnyOf1(self):
        """Test BoostSendBoostRequestCredentialAnyOf1"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
