# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.storage_resolve200_response_any_of1_read import StorageResolve200ResponseAnyOf1Read

class TestStorageResolve200ResponseAnyOf1Read(unittest.TestCase):
    """StorageResolve200ResponseAnyOf1Read unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> StorageResolve200ResponseAnyOf1Read:
        """Test StorageResolve200ResponseAnyOf1Read
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `StorageResolve200ResponseAnyOf1Read`
        """
        model = StorageResolve200ResponseAnyOf1Read()
        if include_optional:
            return StorageResolve200ResponseAnyOf1Read(
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
                    }
            )
        else:
            return StorageResolve200ResponseAnyOf1Read(
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
                    },
        )
        """

    def testStorageResolve200ResponseAnyOf1Read(self):
        """Test StorageResolve200ResponseAnyOf1Read"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
