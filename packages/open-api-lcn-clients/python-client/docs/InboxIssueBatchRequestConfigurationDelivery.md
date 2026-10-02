# InboxIssueBatchRequestConfigurationDelivery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**suppress** | **bool** |  | [optional] 
**template** | [**InboxIssueRequestConfigurationDeliveryTemplate**](InboxIssueRequestConfigurationDeliveryTemplate.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_batch_request_configuration_delivery import InboxIssueBatchRequestConfigurationDelivery

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatchRequestConfigurationDelivery from a JSON string
inbox_issue_batch_request_configuration_delivery_instance = InboxIssueBatchRequestConfigurationDelivery.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatchRequestConfigurationDelivery.to_json())

# convert the object into a dict
inbox_issue_batch_request_configuration_delivery_dict = inbox_issue_batch_request_configuration_delivery_instance.to_dict()
# create an instance of InboxIssueBatchRequestConfigurationDelivery from a dict
inbox_issue_batch_request_configuration_delivery_from_dict = InboxIssueBatchRequestConfigurationDelivery.from_dict(inbox_issue_batch_request_configuration_delivery_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


