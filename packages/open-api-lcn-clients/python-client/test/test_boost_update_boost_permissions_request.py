# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.boost_update_boost_permissions_request import BoostUpdateBoostPermissionsRequest

class TestBoostUpdateBoostPermissionsRequest(unittest.TestCase):
    """BoostUpdateBoostPermissionsRequest unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> BoostUpdateBoostPermissionsRequest:
        """Test BoostUpdateBoostPermissionsRequest
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `BoostUpdateBoostPermissionsRequest`
        """
        model = BoostUpdateBoostPermissionsRequest()
        if include_optional:
            return BoostUpdateBoostPermissionsRequest(
                uri = '',
                updates = openapi_client.models.boost_update_boost_permissions_request_updates.boost_updateBoostPermissions_request_updates(
                    can_edit = True, 
                    can_issue = True, 
                    can_revoke = True, 
                    can_manage_permissions = True, 
                    can_issue_children = '', 
                    can_create_children = '', 
                    can_edit_children = '', 
                    can_revoke_children = '', 
                    can_manage_children_permissions = '', 
                    can_manage_children_profiles = True, 
                    can_view_analytics = True, )
            )
        else:
            return BoostUpdateBoostPermissionsRequest(
                uri = '',
                updates = openapi_client.models.boost_update_boost_permissions_request_updates.boost_updateBoostPermissions_request_updates(
                    can_edit = True, 
                    can_issue = True, 
                    can_revoke = True, 
                    can_manage_permissions = True, 
                    can_issue_children = '', 
                    can_create_children = '', 
                    can_edit_children = '', 
                    can_revoke_children = '', 
                    can_manage_children_permissions = '', 
                    can_manage_children_profiles = True, 
                    can_view_analytics = True, ),
        )
        """

    def testBoostUpdateBoostPermissionsRequest(self):
        """Test BoostUpdateBoostPermissionsRequest"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
