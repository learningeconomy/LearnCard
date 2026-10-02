# InboxGetBatch200ResponseItemsInnerResult


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh** | [**InboxIssue200ResponseRefresh**](InboxIssue200ResponseRefresh.md) |  | [optional] 
**issuance_id** | **str** | Present when issuance completed but replay storage could not be confirmed. Reconcile this issuance; do not issue again with a new key. | 
**status** | **str** |  | 
**recipient** | [**InboxGetBatch200ResponseItemsInnerResultOneOfRecipient**](InboxGetBatch200ResponseItemsInnerResultOneOfRecipient.md) |  | 
**claim_url** | **str** | Claim URL of the completed issuance, if available, when replay storage could not be confirmed. | [optional] 
**recipient_did** | **str** |  | [optional] 
**success** | **bool** |  | 
**index** | **int** |  | 
**deduplicated** | **bool** |  | [optional] 
**guardian_status** | **str** |  | [optional] 
**idempotency_key** | **str** |  | [optional] 
**error** | [**InboxGetBatch200ResponseItemsInnerResultOneOf1Error**](InboxGetBatch200ResponseItemsInnerResultOneOf1Error.md) |  | 

## Example

```python
from openapi_client.models.inbox_get_batch200_response_items_inner_result import InboxGetBatch200ResponseItemsInnerResult

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetBatch200ResponseItemsInnerResult from a JSON string
inbox_get_batch200_response_items_inner_result_instance = InboxGetBatch200ResponseItemsInnerResult.from_json(json)
# print the JSON string representation of the object
print(InboxGetBatch200ResponseItemsInnerResult.to_json())

# convert the object into a dict
inbox_get_batch200_response_items_inner_result_dict = inbox_get_batch200_response_items_inner_result_instance.to_dict()
# create an instance of InboxGetBatch200ResponseItemsInnerResult from a dict
inbox_get_batch200_response_items_inner_result_from_dict = InboxGetBatch200ResponseItemsInnerResult.from_dict(inbox_get_batch200_response_items_inner_result_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


