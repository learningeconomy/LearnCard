# AppStoreUpdateListingRequestUpdates


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**display_name** | **str** |  | [optional] 
**tagline** | **str** |  | [optional] 
**full_description** | **str** |  | [optional] 
**icon_url** | **str** |  | [optional] 
**launch_type** | **str** |  | [optional] 
**launch_config_json** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**promo_video_url** | **str** |  | [optional] 
**ios_app_store_id** | **str** |  | [optional] 
**android_app_store_id** | **str** |  | [optional] 
**privacy_policy_url** | **str** |  | [optional] 
**terms_url** | **str** |  | [optional] 
**highlights** | **List[str]** |  | [optional] 
**screenshots** | **List[str]** |  | [optional] 
**hero_background_color** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_update_listing_request_updates import AppStoreUpdateListingRequestUpdates

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreUpdateListingRequestUpdates from a JSON string
app_store_update_listing_request_updates_instance = AppStoreUpdateListingRequestUpdates.from_json(json)
# print the JSON string representation of the object
print(AppStoreUpdateListingRequestUpdates.to_json())

# convert the object into a dict
app_store_update_listing_request_updates_dict = app_store_update_listing_request_updates_instance.to_dict()
# create an instance of AppStoreUpdateListingRequestUpdates from a dict
app_store_update_listing_request_updates_from_dict = AppStoreUpdateListingRequestUpdates.from_dict(app_store_update_listing_request_updates_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


