# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.api.utilities_api import UtilitiesApi


class TestUtilitiesApi(unittest.TestCase):
    """UtilitiesApi unit test stubs"""

    def setUp(self) -> None:
        self.api = UtilitiesApi()

    def tearDown(self) -> None:
        pass

    def test_utilities_get_challenges(self) -> None:
        """Test case for utilities_get_challenges

        Request a list of valid challenges
        """
        pass

    def test_utilities_get_did(self) -> None:
        """Test case for utilities_get_did

        Get LCN Did
        """
        pass

    def test_utilities_health_check(self) -> None:
        """Test case for utilities_health_check

        Check health of endpoint
        """
        pass


if __name__ == '__main__':
    unittest.main()
