# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.storage_resolve200_response_any_of_any_of_write import StorageResolve200ResponseAnyOfAnyOfWrite

class TestStorageResolve200ResponseAnyOfAnyOfWrite(unittest.TestCase):
    """StorageResolve200ResponseAnyOfAnyOfWrite unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> StorageResolve200ResponseAnyOfAnyOfWrite:
        """Test StorageResolve200ResponseAnyOfAnyOfWrite
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `StorageResolve200ResponseAnyOfAnyOfWrite`
        """
        model = StorageResolve200ResponseAnyOfAnyOfWrite()
        if include_optional:
            return StorageResolve200ResponseAnyOfAnyOfWrite(
                credentials = openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials.storage_resolve_200_response_anyOf_anyOf_read_credentials(
                    categories = {
                        'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                            required = True, )
                        }, ),
                personal = {
                    'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                        required = True, )
                    }
            )
        else:
            return StorageResolve200ResponseAnyOfAnyOfWrite(
                credentials = openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials.storage_resolve_200_response_anyOf_anyOf_read_credentials(
                    categories = {
                        'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                            required = True, )
                        }, ),
                personal = {
                    'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                        required = True, )
                    },
        )
        """

    def testStorageResolve200ResponseAnyOfAnyOfWrite(self):
        """Test StorageResolve200ResponseAnyOfAnyOfWrite"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
