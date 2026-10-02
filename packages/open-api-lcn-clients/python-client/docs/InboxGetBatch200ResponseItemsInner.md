# InboxGetBatch200ResponseItemsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**index** | **int** |  | 
**state** | **str** |  | 
**result** | [**InboxGetBatch200ResponseItemsInnerResult**](InboxGetBatch200ResponseItemsInnerResult.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_batch200_response_items_inner import InboxGetBatch200ResponseItemsInner

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetBatch200ResponseItemsInner from a JSON string
inbox_get_batch200_response_items_inner_instance = InboxGetBatch200ResponseItemsInner.from_json(json)
# print the JSON string representation of the object
print(InboxGetBatch200ResponseItemsInner.to_json())

# convert the object into a dict
inbox_get_batch200_response_items_inner_dict = inbox_get_batch200_response_items_inner_instance.to_dict()
# create an instance of InboxGetBatch200ResponseItemsInner from a dict
inbox_get_batch200_response_items_inner_from_dict = InboxGetBatch200ResponseItemsInner.from_dict(inbox_get_batch200_response_items_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


