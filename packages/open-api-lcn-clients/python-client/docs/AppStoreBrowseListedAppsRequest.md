# AppStoreBrowseListedAppsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] 
**cursor** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**promotion_level** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_browse_listed_apps_request import AppStoreBrowseListedAppsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreBrowseListedAppsRequest from a JSON string
app_store_browse_listed_apps_request_instance = AppStoreBrowseListedAppsRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreBrowseListedAppsRequest.to_json())

# convert the object into a dict
app_store_browse_listed_apps_request_dict = app_store_browse_listed_apps_request_instance.to_dict()
# create an instance of AppStoreBrowseListedAppsRequest from a dict
app_store_browse_listed_apps_request_from_dict = AppStoreBrowseListedAppsRequest.from_dict(app_store_browse_listed_apps_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


