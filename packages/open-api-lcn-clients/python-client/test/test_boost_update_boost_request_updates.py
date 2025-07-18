# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_update_boost_request_updates import BoostUpdateBoostRequestUpdates

class TestBoostUpdateBoostRequestUpdates(unittest.TestCase):
    """BoostUpdateBoostRequestUpdates unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostUpdateBoostRequestUpdates:
        """Test BoostUpdateBoostRequestUpdates
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostUpdateBoostRequestUpdates`
        """
        model = BoostUpdateBoostRequestUpdates()
        if include_optional:
            return BoostUpdateBoostRequestUpdates(
                name = '',
                type = '',
                category = '',
                status = 'DRAFT',
                auto_connect_recipients = True,
                meta = {
                    'key' : null
                    },
                allow_anyone_to_create_children = True,
                credential = None
            )
        else:
            return BoostUpdateBoostRequestUpdates(
        )
        """

    def testBoostUpdateBoostRequestUpdates(self):
        """Test BoostUpdateBoostRequestUpdates"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
