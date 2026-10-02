# InboxGetBatch200ResponseItemsInnerResultOneOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh** | [**InboxIssue200ResponseRefresh**](InboxIssue200ResponseRefresh.md) |  | [optional] 
**issuance_id** | **str** |  | 
**status** | **str** |  | 
**recipient** | [**InboxGetBatch200ResponseItemsInnerResultOneOfRecipient**](InboxGetBatch200ResponseItemsInnerResultOneOfRecipient.md) |  | 
**claim_url** | **str** |  | [optional] 
**recipient_did** | **str** |  | [optional] 
**success** | **bool** |  | 
**index** | **int** |  | 
**deduplicated** | **bool** |  | [optional] 
**guardian_status** | **str** |  | [optional] 
**idempotency_key** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_batch200_response_items_inner_result_one_of import InboxGetBatch200ResponseItemsInnerResultOneOf

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetBatch200ResponseItemsInnerResultOneOf from a JSON string
inbox_get_batch200_response_items_inner_result_one_of_instance = InboxGetBatch200ResponseItemsInnerResultOneOf.from_json(json)
# print the JSON string representation of the object
print(InboxGetBatch200ResponseItemsInnerResultOneOf.to_json())

# convert the object into a dict
inbox_get_batch200_response_items_inner_result_one_of_dict = inbox_get_batch200_response_items_inner_result_one_of_instance.to_dict()
# create an instance of InboxGetBatch200ResponseItemsInnerResultOneOf from a dict
inbox_get_batch200_response_items_inner_result_one_of_from_dict = InboxGetBatch200ResponseItemsInnerResultOneOf.from_dict(inbox_get_batch200_response_items_inner_result_one_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


