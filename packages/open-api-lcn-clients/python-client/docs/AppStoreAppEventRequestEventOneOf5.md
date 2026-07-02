# AppStoreAppEventRequestEventOneOf5


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**session_title** | **str** |  | 
**summary_data** | [**AppStoreAppEventRequestEventOneOf5SummaryData**](AppStoreAppEventRequestEventOneOf5SummaryData.md) |  | 
**metadata** | **Dict[str, object]** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_app_event_request_event_one_of5 import AppStoreAppEventRequestEventOneOf5

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventOneOf5 from a JSON string
app_store_app_event_request_event_one_of5_instance = AppStoreAppEventRequestEventOneOf5.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventOneOf5.to_json())

# convert the object into a dict
app_store_app_event_request_event_one_of5_dict = app_store_app_event_request_event_one_of5_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventOneOf5 from a dict
app_store_app_event_request_event_one_of5_from_dict = AppStoreAppEventRequestEventOneOf5.from_dict(app_store_app_event_request_event_one_of5_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


