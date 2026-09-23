# InboxGetMyInboxDeliveries200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**credential** | [**InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential**](InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential.md) |  | 
**expires_at** | **str** |  | 

## Example

```python
from openapi_client.models.inbox_get_my_inbox_deliveries200_response_records_inner import InboxGetMyInboxDeliveries200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyInboxDeliveries200ResponseRecordsInner from a JSON string
inbox_get_my_inbox_deliveries200_response_records_inner_instance = InboxGetMyInboxDeliveries200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyInboxDeliveries200ResponseRecordsInner.to_json())

# convert the object into a dict
inbox_get_my_inbox_deliveries200_response_records_inner_dict = inbox_get_my_inbox_deliveries200_response_records_inner_instance.to_dict()
# create an instance of InboxGetMyInboxDeliveries200ResponseRecordsInner from a dict
inbox_get_my_inbox_deliveries200_response_records_inner_from_dict = InboxGetMyInboxDeliveries200ResponseRecordsInner.from_dict(inbox_get_my_inbox_deliveries200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


