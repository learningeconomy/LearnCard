# InboxIssueBatchRequestItemsInnerConfigurationDelivery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**suppress** | **bool** |  | [optional] 
**template** | [**InboxIssueRequestConfigurationDeliveryTemplate**](InboxIssueRequestConfigurationDeliveryTemplate.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_batch_request_items_inner_configuration_delivery import InboxIssueBatchRequestItemsInnerConfigurationDelivery

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatchRequestItemsInnerConfigurationDelivery from a JSON string
inbox_issue_batch_request_items_inner_configuration_delivery_instance = InboxIssueBatchRequestItemsInnerConfigurationDelivery.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatchRequestItemsInnerConfigurationDelivery.to_json())

# convert the object into a dict
inbox_issue_batch_request_items_inner_configuration_delivery_dict = inbox_issue_batch_request_items_inner_configuration_delivery_instance.to_dict()
# create an instance of InboxIssueBatchRequestItemsInnerConfigurationDelivery from a dict
inbox_issue_batch_request_items_inner_configuration_delivery_from_dict = InboxIssueBatchRequestItemsInnerConfigurationDelivery.from_dict(inbox_issue_batch_request_items_inner_configuration_delivery_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


