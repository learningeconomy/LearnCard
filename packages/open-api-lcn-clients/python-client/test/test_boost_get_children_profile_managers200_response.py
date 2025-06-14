# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_get_children_profile_managers200_response import BoostGetChildrenProfileManagers200Response

class TestBoostGetChildrenProfileManagers200Response(unittest.TestCase):
    """BoostGetChildrenProfileManagers200Response unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostGetChildrenProfileManagers200Response:
        """Test BoostGetChildrenProfileManagers200Response
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostGetChildrenProfileManagers200Response`
        """
        model = BoostGetChildrenProfileManagers200Response()
        if include_optional:
            return BoostGetChildrenProfileManagers200Response(
                cursor = '',
                has_more = True,
                records = [
                    openapi_client.models.boost_get_children_profile_managers_200_response_records_inner.boost_getChildrenProfileManagers_200_response_records_inner(
                        id = '', 
                        created = '', 
                        display_name = '', 
                        short_bio = '', 
                        bio = '', 
                        email = '', 
                        image = '', 
                        hero_image = '', 
                        did = '', )
                    ]
            )
        else:
            return BoostGetChildrenProfileManagers200Response(
                has_more = True,
                records = [
                    openapi_client.models.boost_get_children_profile_managers_200_response_records_inner.boost_getChildrenProfileManagers_200_response_records_inner(
                        id = '', 
                        created = '', 
                        display_name = '', 
                        short_bio = '', 
                        bio = '', 
                        email = '', 
                        image = '', 
                        hero_image = '', 
                        did = '', )
                    ],
        )
        """

    def testBoostGetChildrenProfileManagers200Response(self):
        """Test BoostGetChildrenProfileManagers200Response"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
