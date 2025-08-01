# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from openapi_client.models.inbox_issue_request_configuration_delivery_template import InboxIssueRequestConfigurationDeliveryTemplate

class TestInboxIssueRequestConfigurationDeliveryTemplate(unittest.TestCase):
    """InboxIssueRequestConfigurationDeliveryTemplate unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> InboxIssueRequestConfigurationDeliveryTemplate:
        """Test InboxIssueRequestConfigurationDeliveryTemplate
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `InboxIssueRequestConfigurationDeliveryTemplate`
        """
        model = InboxIssueRequestConfigurationDeliveryTemplate()
        if include_optional:
            return InboxIssueRequestConfigurationDeliveryTemplate(
                id = 'universal-inbox-claim',
                model = openapi_client.models.inbox_issue_request_configuration_delivery_template_model.inbox_issue_request_configuration_delivery_template_model(
                    issuer = openapi_client.models.inbox_issue_request_configuration_delivery_template_model_issuer.inbox_issue_request_configuration_delivery_template_model_issuer(
                        name = '', 
                        logo_url = '', ), 
                    credential = openapi_client.models.inbox_issue_request_configuration_delivery_template_model_credential.inbox_issue_request_configuration_delivery_template_model_credential(
                        name = '', 
                        type = '', ), 
                    recipient = openapi_client.models.inbox_issue_request_configuration_delivery_template_model_recipient.inbox_issue_request_configuration_delivery_template_model_recipient(
                        name = '', ), )
            )
        else:
            return InboxIssueRequestConfigurationDeliveryTemplate(
                model = openapi_client.models.inbox_issue_request_configuration_delivery_template_model.inbox_issue_request_configuration_delivery_template_model(
                    issuer = openapi_client.models.inbox_issue_request_configuration_delivery_template_model_issuer.inbox_issue_request_configuration_delivery_template_model_issuer(
                        name = '', 
                        logo_url = '', ), 
                    credential = openapi_client.models.inbox_issue_request_configuration_delivery_template_model_credential.inbox_issue_request_configuration_delivery_template_model_credential(
                        name = '', 
                        type = '', ), 
                    recipient = openapi_client.models.inbox_issue_request_configuration_delivery_template_model_recipient.inbox_issue_request_configuration_delivery_template_model_recipient(
                        name = '', ), ),
        )
        """

    def testInboxIssueRequestConfigurationDeliveryTemplate(self):
        """Test InboxIssueRequestConfigurationDeliveryTemplate"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
