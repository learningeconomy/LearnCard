# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.contracts_get_credentials_for_contract200_response import ContractsGetCredentialsForContract200Response

class TestContractsGetCredentialsForContract200Response(unittest.TestCase):
    """ContractsGetCredentialsForContract200Response unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> ContractsGetCredentialsForContract200Response:
        """Test ContractsGetCredentialsForContract200Response
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `ContractsGetCredentialsForContract200Response`
        """
        model = ContractsGetCredentialsForContract200Response()
        if include_optional:
            return ContractsGetCredentialsForContract200Response(
                cursor = '',
                has_more = True,
                records = [
                    openapi_client.models.contracts_get_credentials_for_contract_200_response_records_inner.contracts_getCredentialsForContract_200_response_records_inner(
                        credential_uri = '', 
                        terms_uri = '', 
                        contract_uri = '', 
                        boost_uri = '', 
                        category = '', 
                        date = '', )
                    ]
            )
        else:
            return ContractsGetCredentialsForContract200Response(
                has_more = True,
                records = [
                    openapi_client.models.contracts_get_credentials_for_contract_200_response_records_inner.contracts_getCredentialsForContract_200_response_records_inner(
                        credential_uri = '', 
                        terms_uri = '', 
                        contract_uri = '', 
                        boost_uri = '', 
                        category = '', 
                        date = '', )
                    ],
        )
        """

    def testContractsGetCredentialsForContract200Response(self):
        """Test ContractsGetCredentialsForContract200Response"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
