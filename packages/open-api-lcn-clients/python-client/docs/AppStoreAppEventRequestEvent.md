# AppStoreAppEventRequestEvent


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**template_alias** | **str** |  | 
**template_data** | **Dict[str, object]** |  | [optional] 
**prevent_duplicate_claim** | **bool** |  | [optional] 
**boost_uri** | **str** |  | [optional] 
**recipient** | **str** |  | 
**limit** | **float** |  | [optional] 
**cursor** | **str** |  | [optional] 
**include_credentials** | **bool** |  | [optional] [default to True]
**include_personal_data** | **bool** |  | [optional] [default to False]
**format** | **str** |  | [optional] [default to 'prompt']
**instructions** | **str** |  | [optional] 
**detail_level** | **str** |  | [optional] [default to 'compact']
**wait_for_sync** | **bool** |  | [optional] [default to False]
**session_title** | **str** |  | 
**summary_data** | [**AppStoreAppEventRequestEventOneOf5SummaryData**](AppStoreAppEventRequestEventOneOf5SummaryData.md) |  | 
**metadata** | **Dict[str, object]** |  | [optional] 
**title** | **str** |  | [optional] 
**body** | **str** |  | [optional] 
**action_path** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**priority** | **str** |  | [optional] 
**key** | **str** |  | 
**amount** | **int** |  | 
**keys** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_app_event_request_event import AppStoreAppEventRequestEvent

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEvent from a JSON string
app_store_app_event_request_event_instance = AppStoreAppEventRequestEvent.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEvent.to_json())

# convert the object into a dict
app_store_app_event_request_event_dict = app_store_app_event_request_event_instance.to_dict()
# create an instance of AppStoreAppEventRequestEvent from a dict
app_store_app_event_request_event_from_dict = AppStoreAppEventRequestEvent.from_dict(app_store_app_event_request_event_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


