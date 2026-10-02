# InboxGetMyInboxDeliveriesRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **int** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_inbox_deliveries_request import InboxGetMyInboxDeliveriesRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyInboxDeliveriesRequest from a JSON string
inbox_get_my_inbox_deliveries_request_instance = InboxGetMyInboxDeliveriesRequest.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyInboxDeliveriesRequest.to_json())

# convert the object into a dict
inbox_get_my_inbox_deliveries_request_dict = inbox_get_my_inbox_deliveries_request_instance.to_dict()
# create an instance of InboxGetMyInboxDeliveriesRequest from a dict
inbox_get_my_inbox_deliveries_request_from_dict = InboxGetMyInboxDeliveriesRequest.from_dict(inbox_get_my_inbox_deliveries_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


