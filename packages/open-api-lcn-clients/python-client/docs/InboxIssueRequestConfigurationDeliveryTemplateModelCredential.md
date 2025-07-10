# InboxIssueRequestConfigurationDeliveryTemplateModelCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** | The name of the credential (e.g., \&quot;Bachelor of Science\&quot;). | [optional] 
**type** | **str** | The type of the credential (e.g., \&quot;degree\&quot;, \&quot;certificate\&quot;). | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_request_configuration_delivery_template_model_credential import InboxIssueRequestConfigurationDeliveryTemplateModelCredential

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestConfigurationDeliveryTemplateModelCredential from a JSON string
inbox_issue_request_configuration_delivery_template_model_credential_instance = InboxIssueRequestConfigurationDeliveryTemplateModelCredential.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestConfigurationDeliveryTemplateModelCredential.to_json())

# convert the object into a dict
inbox_issue_request_configuration_delivery_template_model_credential_dict = inbox_issue_request_configuration_delivery_template_model_credential_instance.to_dict()
# create an instance of InboxIssueRequestConfigurationDeliveryTemplateModelCredential from a dict
inbox_issue_request_configuration_delivery_template_model_credential_from_dict = InboxIssueRequestConfigurationDeliveryTemplateModelCredential.from_dict(inbox_issue_request_configuration_delivery_template_model_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


