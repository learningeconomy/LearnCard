# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.contracts_create_consent_flow_contract_request import ContractsCreateConsentFlowContractRequest

class TestContractsCreateConsentFlowContractRequest(unittest.TestCase):
    """ContractsCreateConsentFlowContractRequest unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> ContractsCreateConsentFlowContractRequest:
        """Test ContractsCreateConsentFlowContractRequest
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `ContractsCreateConsentFlowContractRequest`
        """
        model = ContractsCreateConsentFlowContractRequest()
        if include_optional:
            return ContractsCreateConsentFlowContractRequest(
                contract = openapi_client.models.contracts_create_consent_flow_contract_request_contract.contracts_createConsentFlowContract_request_contract(
                    read = openapi_client.models.contracts_create_consent_flow_contract_request_contract_read.contracts_createConsentFlowContract_request_contract_read(
                        anonymize = True, 
                        credentials = openapi_client.models.contracts_create_consent_flow_contract_request_contract_read_credentials.contracts_createConsentFlowContract_request_contract_read_credentials(
                            categories = {
                                'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                                    required = True, )
                                }, ), 
                        personal = {
                            'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                                required = True, )
                            }, ), 
                    write = openapi_client.models.contracts_create_consent_flow_contract_request_contract_write.contracts_createConsentFlowContract_request_contract_write(), ),
                name = '',
                subtitle = '',
                description = '',
                reason_for_accessing = '',
                needs_guardian_consent = True,
                redirect_url = '',
                front_door_boost_uri = '',
                image = '',
                expires_at = '',
                autoboosts = [
                    openapi_client.models.contracts_create_consent_flow_contract_request_autoboosts_inner.contracts_createConsentFlowContract_request_autoboosts_inner(
                        boost_uri = '', 
                        signing_authority = openapi_client.models.contracts_create_consent_flow_contract_request_autoboosts_inner_signing_authority.contracts_createConsentFlowContract_request_autoboosts_inner_signingAuthority(
                            endpoint = '', 
                            name = '', ), )
                    ],
                writers = [
                    ''
                    ]
            )
        else:
            return ContractsCreateConsentFlowContractRequest(
                contract = openapi_client.models.contracts_create_consent_flow_contract_request_contract.contracts_createConsentFlowContract_request_contract(
                    read = openapi_client.models.contracts_create_consent_flow_contract_request_contract_read.contracts_createConsentFlowContract_request_contract_read(
                        anonymize = True, 
                        credentials = openapi_client.models.contracts_create_consent_flow_contract_request_contract_read_credentials.contracts_createConsentFlowContract_request_contract_read_credentials(
                            categories = {
                                'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                                    required = True, )
                                }, ), 
                        personal = {
                            'key' : openapi_client.models.storage_resolve_200_response_any_of_any_of_read_credentials_categories_value.storage_resolve_200_response_anyOf_anyOf_read_credentials_categories_value(
                                required = True, )
                            }, ), 
                    write = openapi_client.models.contracts_create_consent_flow_contract_request_contract_write.contracts_createConsentFlowContract_request_contract_write(), ),
                name = '',
        )
        """

    def testContractsCreateConsentFlowContractRequest(self):
        """Test ContractsCreateConsentFlowContractRequest"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
