# InboxIssueRequestConfigurationDeliveryTemplateModel

The template model to use for the credential delivery. Injects via template variables into email/sms templates. If not provided, the default template will be used.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**issuer** | [**InboxIssueRequestConfigurationDeliveryTemplateModelIssuer**](InboxIssueRequestConfigurationDeliveryTemplateModelIssuer.md) |  | [optional] 
**credential** | [**InboxIssueRequestConfigurationDeliveryTemplateModelCredential**](InboxIssueRequestConfigurationDeliveryTemplateModelCredential.md) |  | [optional] 
**recipient** | [**InboxIssueRequestConfigurationDeliveryTemplateModelRecipient**](InboxIssueRequestConfigurationDeliveryTemplateModelRecipient.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_request_configuration_delivery_template_model import InboxIssueRequestConfigurationDeliveryTemplateModel

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestConfigurationDeliveryTemplateModel from a JSON string
inbox_issue_request_configuration_delivery_template_model_instance = InboxIssueRequestConfigurationDeliveryTemplateModel.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestConfigurationDeliveryTemplateModel.to_json())

# convert the object into a dict
inbox_issue_request_configuration_delivery_template_model_dict = inbox_issue_request_configuration_delivery_template_model_instance.to_dict()
# create an instance of InboxIssueRequestConfigurationDeliveryTemplateModel from a dict
inbox_issue_request_configuration_delivery_template_model_from_dict = InboxIssueRequestConfigurationDeliveryTemplateModel.from_dict(inbox_issue_request_configuration_delivery_template_model_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


