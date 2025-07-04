# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.did_metadata_add_did_metadata_request_verification_method_inner_any_of_public_key_jwk import DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk

class TestDidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk(unittest.TestCase):
    """DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk:
        """Test DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk`
        """
        model = DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk()
        if include_optional:
            return DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk(
                kty = '',
                crv = '',
                x = '',
                y = '',
                n = '',
                d = ''
            )
        else:
            return DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk(
                kty = '',
                crv = '',
                x = '',
        )
        """

    def testDidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk(self):
        """Test DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
