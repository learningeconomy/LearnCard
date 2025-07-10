# InboxIssueRequestConfigurationDeliveryTemplate

The template to use for the credential delivery. If not provided, the default template will be used.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** | The template ID to use for the credential delivery. If not provided, the default template will be used. | [optional] 
**model** | [**InboxIssueRequestConfigurationDeliveryTemplateModel**](InboxIssueRequestConfigurationDeliveryTemplateModel.md) |  | 

## Example

```python
from openapi_client.models.inbox_issue_request_configuration_delivery_template import InboxIssueRequestConfigurationDeliveryTemplate

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestConfigurationDeliveryTemplate from a JSON string
inbox_issue_request_configuration_delivery_template_instance = InboxIssueRequestConfigurationDeliveryTemplate.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestConfigurationDeliveryTemplate.to_json())

# convert the object into a dict
inbox_issue_request_configuration_delivery_template_dict = inbox_issue_request_configuration_delivery_template_instance.to_dict()
# create an instance of InboxIssueRequestConfigurationDeliveryTemplate from a dict
inbox_issue_request_configuration_delivery_template_from_dict = InboxIssueRequestConfigurationDeliveryTemplate.from_dict(inbox_issue_request_configuration_delivery_template_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


