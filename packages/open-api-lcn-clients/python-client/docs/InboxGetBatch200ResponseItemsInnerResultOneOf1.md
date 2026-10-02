# InboxGetBatch200ResponseItemsInnerResultOneOf1


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **bool** |  | 
**index** | **int** |  | 
**idempotency_key** | **str** |  | [optional] 
**recipient** | [**InboxGetBatch200ResponseItemsInnerResultOneOfRecipient**](InboxGetBatch200ResponseItemsInnerResultOneOfRecipient.md) |  | [optional] 
**error** | [**InboxGetBatch200ResponseItemsInnerResultOneOf1Error**](InboxGetBatch200ResponseItemsInnerResultOneOf1Error.md) |  | 
**issuance_id** | **str** | Present when issuance completed but replay storage could not be confirmed. Reconcile this issuance; do not issue again with a new key. | [optional] 
**claim_url** | **str** | Claim URL of the completed issuance, if available, when replay storage could not be confirmed. | [optional] 

## Example

```python
from openapi_client.models.inbox_get_batch200_response_items_inner_result_one_of1 import InboxGetBatch200ResponseItemsInnerResultOneOf1

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetBatch200ResponseItemsInnerResultOneOf1 from a JSON string
inbox_get_batch200_response_items_inner_result_one_of1_instance = InboxGetBatch200ResponseItemsInnerResultOneOf1.from_json(json)
# print the JSON string representation of the object
print(InboxGetBatch200ResponseItemsInnerResultOneOf1.to_json())

# convert the object into a dict
inbox_get_batch200_response_items_inner_result_one_of1_dict = inbox_get_batch200_response_items_inner_result_one_of1_instance.to_dict()
# create an instance of InboxGetBatch200ResponseItemsInnerResultOneOf1 from a dict
inbox_get_batch200_response_items_inner_result_one_of1_from_dict = InboxGetBatch200ResponseItemsInnerResultOneOf1.from_dict(inbox_get_batch200_response_items_inner_result_one_of1_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


