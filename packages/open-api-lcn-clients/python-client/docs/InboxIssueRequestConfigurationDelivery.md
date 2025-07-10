# InboxIssueRequestConfigurationDelivery

Configuration for the credential delivery i.e. email or SMS. When credentials are sent to a user who has a verified email or phone associated with their account, delivery is skipped, and the credential will be sent using in-app notifications. If not provided, the default configuration will be used.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**suppress** | **bool** | Whether to suppress delivery of the credential to the recipient. If true, the email/sms will not be sent to the recipient. Useful if you would like to manually send claim link to your users. | [optional] [default to False]
**template** | [**InboxIssueRequestConfigurationDeliveryTemplate**](InboxIssueRequestConfigurationDeliveryTemplate.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_request_configuration_delivery import InboxIssueRequestConfigurationDelivery

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestConfigurationDelivery from a JSON string
inbox_issue_request_configuration_delivery_instance = InboxIssueRequestConfigurationDelivery.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestConfigurationDelivery.to_json())

# convert the object into a dict
inbox_issue_request_configuration_delivery_dict = inbox_issue_request_configuration_delivery_instance.to_dict()
# create an instance of InboxIssueRequestConfigurationDelivery from a dict
inbox_issue_request_configuration_delivery_from_dict = InboxIssueRequestConfigurationDelivery.from_dict(inbox_issue_request_configuration_delivery_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


