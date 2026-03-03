# AppStoreGetInstalledApps200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**listing_id** | **str** |  | 
**slug** | **str** |  | [optional] 
**display_name** | **str** |  | 
**tagline** | **str** |  | 
**full_description** | **str** |  | 
**icon_url** | **str** |  | 
**app_listing_status** | **str** |  | 
**launch_type** | **str** |  | 
**launch_config_json** | **str** |  | 
**category** | **str** |  | [optional] 
**promo_video_url** | **str** |  | [optional] 
**promotion_level** | **str** |  | [optional] 
**ios_app_store_id** | **str** |  | [optional] 
**android_app_store_id** | **str** |  | [optional] 
**privacy_policy_url** | **str** |  | [optional] 
**terms_url** | **str** |  | [optional] 
**hero_background_color** | **str** |  | [optional] 
**highlights** | **List[str]** |  | [optional] 
**screenshots** | **List[str]** |  | [optional] 
**installed_at** | **str** |  | 

## Example

```python
from openapi_client.models.app_store_get_installed_apps200_response_records_inner import AppStoreGetInstalledApps200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetInstalledApps200ResponseRecordsInner from a JSON string
app_store_get_installed_apps200_response_records_inner_instance = AppStoreGetInstalledApps200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetInstalledApps200ResponseRecordsInner.to_json())

# convert the object into a dict
app_store_get_installed_apps200_response_records_inner_dict = app_store_get_installed_apps200_response_records_inner_instance.to_dict()
# create an instance of AppStoreGetInstalledApps200ResponseRecordsInner from a dict
app_store_get_installed_apps200_response_records_inner_from_dict = AppStoreGetInstalledApps200ResponseRecordsInner.from_dict(app_store_get_installed_apps200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


