# AppStoreAppEventRequestEventOneOf4


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**include_credentials** | **bool** |  | [optional] [default to True]
**include_personal_data** | **bool** |  | [optional] [default to False]
**format** | **str** |  | [optional] [default to 'prompt']
**instructions** | **str** |  | [optional] 
**detail_level** | **str** |  | [optional] [default to 'compact']
**wait_for_sync** | **bool** |  | [optional] [default to False]

## Example

```python
from openapi_client.models.app_store_app_event_request_event_one_of4 import AppStoreAppEventRequestEventOneOf4

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventOneOf4 from a JSON string
app_store_app_event_request_event_one_of4_instance = AppStoreAppEventRequestEventOneOf4.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventOneOf4.to_json())

# convert the object into a dict
app_store_app_event_request_event_one_of4_dict = app_store_app_event_request_event_one_of4_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventOneOf4 from a dict
app_store_app_event_request_event_one_of4_from_dict = AppStoreAppEventRequestEventOneOf4.from_dict(app_store_app_event_request_event_one_of4_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


