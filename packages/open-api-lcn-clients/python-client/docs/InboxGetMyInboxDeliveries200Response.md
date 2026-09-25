# InboxGetMyInboxDeliveries200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**records** | [**List[InboxGetMyInboxDeliveries200ResponseRecordsInner]**](InboxGetMyInboxDeliveries200ResponseRecordsInner.md) |  | 
**has_more** | **bool** |  | 
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_inbox_deliveries200_response import InboxGetMyInboxDeliveries200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyInboxDeliveries200Response from a JSON string
inbox_get_my_inbox_deliveries200_response_instance = InboxGetMyInboxDeliveries200Response.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyInboxDeliveries200Response.to_json())

# convert the object into a dict
inbox_get_my_inbox_deliveries200_response_dict = inbox_get_my_inbox_deliveries200_response_instance.to_dict()
# create an instance of InboxGetMyInboxDeliveries200Response from a dict
inbox_get_my_inbox_deliveries200_response_from_dict = InboxGetMyInboxDeliveries200Response.from_dict(inbox_get_my_inbox_deliveries200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


