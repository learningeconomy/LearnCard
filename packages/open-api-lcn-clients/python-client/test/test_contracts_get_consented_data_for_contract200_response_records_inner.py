# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.contracts_get_consented_data_for_contract200_response_records_inner import ContractsGetConsentedDataForContract200ResponseRecordsInner

class TestContractsGetConsentedDataForContract200ResponseRecordsInner(unittest.TestCase):
    """ContractsGetConsentedDataForContract200ResponseRecordsInner unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> ContractsGetConsentedDataForContract200ResponseRecordsInner:
        """Test ContractsGetConsentedDataForContract200ResponseRecordsInner
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `ContractsGetConsentedDataForContract200ResponseRecordsInner`
        """
        model = ContractsGetConsentedDataForContract200ResponseRecordsInner()
        if include_optional:
            return ContractsGetConsentedDataForContract200ResponseRecordsInner(
                credentials = openapi_client.models.contracts_get_consented_data_for_contract_200_response_records_inner_credentials.contracts_getConsentedDataForContract_200_response_records_inner_credentials(
                    categories = {
                        'key' : [
                            ''
                            ]
                        }, ),
                personal = {
                    'key' : ''
                    },
                var_date = ''
            )
        else:
            return ContractsGetConsentedDataForContract200ResponseRecordsInner(
                credentials = openapi_client.models.contracts_get_consented_data_for_contract_200_response_records_inner_credentials.contracts_getConsentedDataForContract_200_response_records_inner_credentials(
                    categories = {
                        'key' : [
                            ''
                            ]
                        }, ),
                personal = {
                    'key' : ''
                    },
                var_date = '',
        )
        """

    def testContractsGetConsentedDataForContract200ResponseRecordsInner(self):
        """Test ContractsGetConsentedDataForContract200ResponseRecordsInner"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
