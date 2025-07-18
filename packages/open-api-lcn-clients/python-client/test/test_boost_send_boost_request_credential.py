# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_send_boost_request_credential import BoostSendBoostRequestCredential

class TestBoostSendBoostRequestCredential(unittest.TestCase):
    """BoostSendBoostRequestCredential unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostSendBoostRequestCredential:
        """Test BoostSendBoostRequestCredential
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostSendBoostRequestCredential`
        """
        model = BoostSendBoostRequestCredential()
        if include_optional:
            return BoostSendBoostRequestCredential(
                context = [
                    null
                    ],
                id = '',
                type = [
                    ''
                    ],
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
            return BoostSendBoostRequestCredential(
                context = [
                    null
                    ],
                type = [
                    ''
                    ],
                issuer = None,
                credential_subject = None,
                proof = None,
                protected = '',
                iv = '',
                ciphertext = '',
                tag = '',
        )
        """

    def testBoostSendBoostRequestCredential(self):
        """Test BoostSendBoostRequestCredential"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
