# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.storage_resolve200_response import StorageResolve200Response

class TestStorageResolve200Response(unittest.TestCase):
    """StorageResolve200Response unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> StorageResolve200Response:
        """Test StorageResolve200Response
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `StorageResolve200Response`
        """
        model = StorageResolve200Response()
        if include_optional:
            return StorageResolve200Response(
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
                holder = '',
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
                    ],
                read = openapi_client.models.storage_resolve_200_response_any_of_1_read.storage_resolve_200_response_anyOf_1_read(
                    anonymize = True, 
                    credentials = openapi_client.models.storage_resolve_200_response_any_of_1_read_credentials.storage_resolve_200_response_anyOf_1_read_credentials(
                        share_all = True, 
                        sharing = True, 
                        categories = {
                            'key' : openapi_client.models.storage_resolve_200_response_any_of_1_read_credentials_categories_value.storage_resolve_200_response_anyOf_1_read_credentials_categories_value(
                                sharing = True, 
                                shared = [
                                    ''
                                    ], 
                                share_all = True, 
                                share_until = '', )
                            }, ), 
                    personal = {
                        'key' : ''
                        }, ),
                write = openapi_client.models.storage_resolve_200_response_any_of_1_write.storage_resolve_200_response_anyOf_1_write(
                    credentials = openapi_client.models.storage_resolve_200_response_any_of_1_write_credentials.storage_resolve_200_response_anyOf_1_write_credentials(
                        categories = {
                            'key' : True
                            }, ), 
                    personal = {
                        'key' : True
                        }, ),
                denied_writers = [
                    ''
                    ]
            )
        else:
            return StorageResolve200Response(
                context = [
                    null
                    ],
                type = None,
                issuer = None,
                credential_subject = None,
                proof = None,
                protected = '',
                iv = '',
                ciphertext = '',
                tag = '',
                read = openapi_client.models.storage_resolve_200_response_any_of_1_read.storage_resolve_200_response_anyOf_1_read(
                    anonymize = True, 
                    credentials = openapi_client.models.storage_resolve_200_response_any_of_1_read_credentials.storage_resolve_200_response_anyOf_1_read_credentials(
                        share_all = True, 
                        sharing = True, 
                        categories = {
                            'key' : openapi_client.models.storage_resolve_200_response_any_of_1_read_credentials_categories_value.storage_resolve_200_response_anyOf_1_read_credentials_categories_value(
                                sharing = True, 
                                shared = [
                                    ''
                                    ], 
                                share_all = True, 
                                share_until = '', )
                            }, ), 
                    personal = {
                        'key' : ''
                        }, ),
                write = openapi_client.models.storage_resolve_200_response_any_of_1_write.storage_resolve_200_response_anyOf_1_write(
                    credentials = openapi_client.models.storage_resolve_200_response_any_of_1_write_credentials.storage_resolve_200_response_anyOf_1_write_credentials(
                        categories = {
                            'key' : True
                            }, ), 
                    personal = {
                        'key' : True
                        }, ),
        )
        """

    def testStorageResolve200Response(self):
        """Test StorageResolve200Response"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
