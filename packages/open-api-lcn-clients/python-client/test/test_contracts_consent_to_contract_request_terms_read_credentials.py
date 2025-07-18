# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.contracts_consent_to_contract_request_terms_read_credentials import ContractsConsentToContractRequestTermsReadCredentials

class TestContractsConsentToContractRequestTermsReadCredentials(unittest.TestCase):
    """ContractsConsentToContractRequestTermsReadCredentials unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> ContractsConsentToContractRequestTermsReadCredentials:
        """Test ContractsConsentToContractRequestTermsReadCredentials
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `ContractsConsentToContractRequestTermsReadCredentials`
        """
        model = ContractsConsentToContractRequestTermsReadCredentials()
        if include_optional:
            return ContractsConsentToContractRequestTermsReadCredentials(
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
                    }
            )
        else:
            return ContractsConsentToContractRequestTermsReadCredentials(
        )
        """

    def testContractsConsentToContractRequestTermsReadCredentials(self):
        """Test ContractsConsentToContractRequestTermsReadCredentials"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
