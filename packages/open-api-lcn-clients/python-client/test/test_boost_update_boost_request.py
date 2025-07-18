# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_update_boost_request import BoostUpdateBoostRequest

class TestBoostUpdateBoostRequest(unittest.TestCase):
    """BoostUpdateBoostRequest unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostUpdateBoostRequest:
        """Test BoostUpdateBoostRequest
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostUpdateBoostRequest`
        """
        model = BoostUpdateBoostRequest()
        if include_optional:
            return BoostUpdateBoostRequest(
                uri = '',
                updates = openapi_client.models.boost_update_boost_request_updates.boost_updateBoost_request_updates(
                    name = '', 
                    type = '', 
                    category = '', 
                    status = 'DRAFT', 
                    auto_connect_recipients = True, 
                    meta = {
                        'key' : null
                        }, 
                    allow_anyone_to_create_children = True, 
                    credential = null, )
            )
        else:
            return BoostUpdateBoostRequest(
                uri = '',
                updates = openapi_client.models.boost_update_boost_request_updates.boost_updateBoost_request_updates(
                    name = '', 
                    type = '', 
                    category = '', 
                    status = 'DRAFT', 
                    auto_connect_recipients = True, 
                    meta = {
                        'key' : null
                        }, 
                    allow_anyone_to_create_children = True, 
                    credential = null, ),
        )
        """

    def testBoostUpdateBoostRequest(self):
        """Test BoostUpdateBoostRequest"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
