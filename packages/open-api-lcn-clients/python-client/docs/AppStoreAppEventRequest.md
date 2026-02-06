# AppStoreAppEventRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**listing_id** | **str** |  | 
**event** | **Dict[str, object]** |  | 

## Example

```python
from openapi_client.models.app_store_app_event_request import AppStoreAppEventRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequest from a JSON string
app_store_app_event_request_instance = AppStoreAppEventRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequest.to_json())

# convert the object into a dict
app_store_app_event_request_dict = app_store_app_event_request_instance.to_dict()
# create an instance of AppStoreAppEventRequest from a dict
app_store_app_event_request_from_dict = AppStoreAppEventRequest.from_dict(app_store_app_event_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


