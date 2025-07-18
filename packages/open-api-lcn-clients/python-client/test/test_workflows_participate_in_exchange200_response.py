# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.workflows_participate_in_exchange200_response import WorkflowsParticipateInExchange200Response

class TestWorkflowsParticipateInExchange200Response(unittest.TestCase):
    """WorkflowsParticipateInExchange200Response unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> WorkflowsParticipateInExchange200Response:
        """Test WorkflowsParticipateInExchange200Response
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `WorkflowsParticipateInExchange200Response`
        """
        model = WorkflowsParticipateInExchange200Response()
        if include_optional:
            return WorkflowsParticipateInExchange200Response(
                verifiable_presentation = {
                    'key' : null
                    },
                verifiable_presentation_request = openapi_client.models.workflows_participate_in_exchange_200_response_verifiable_presentation_request.workflows_participateInExchange_200_response_verifiablePresentationRequest(
                    query = [
                        openapi_client.models.workflows_participate_in_exchange_200_response_verifiable_presentation_request_query_inner.workflows_participateInExchange_200_response_verifiablePresentationRequest_query_inner(
                            type = '', 
                            credential_query = [
                                openapi_client.models.workflows_participate_in_exchange_200_response_verifiable_presentation_request_query_inner_credential_query_inner.workflows_participateInExchange_200_response_verifiablePresentationRequest_query_inner_credentialQuery_inner(
                                    required = True, 
                                    reason = '', )
                                ], )
                        ], 
                    challenge = '', 
                    domain = '', ),
                redirect_url = ''
            )
        else:
            return WorkflowsParticipateInExchange200Response(
        )
        """

    def testWorkflowsParticipateInExchange200Response(self):
        """Test WorkflowsParticipateInExchange200Response"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
