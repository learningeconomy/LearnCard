# AppStoreGetInstalledApps200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**has_more** | **bool** |  | 
**cursor** | **str** |  | [optional] 
**records** | [**List[AppStoreGetInstalledApps200ResponseRecordsInner]**](AppStoreGetInstalledApps200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.app_store_get_installed_apps200_response import AppStoreGetInstalledApps200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetInstalledApps200Response from a JSON string
app_store_get_installed_apps200_response_instance = AppStoreGetInstalledApps200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetInstalledApps200Response.to_json())

# convert the object into a dict
app_store_get_installed_apps200_response_dict = app_store_get_installed_apps200_response_instance.to_dict()
# create an instance of AppStoreGetInstalledApps200Response from a dict
app_store_get_installed_apps200_response_from_dict = AppStoreGetInstalledApps200Response.from_dict(app_store_get_installed_apps200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


