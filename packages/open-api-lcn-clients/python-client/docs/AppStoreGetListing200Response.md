# AppStoreGetListing200Response


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

## Example

```python
from openapi_client.models.app_store_get_listing200_response import AppStoreGetListing200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListing200Response from a JSON string
app_store_get_listing200_response_instance = AppStoreGetListing200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListing200Response.to_json())

# convert the object into a dict
app_store_get_listing200_response_dict = app_store_get_listing200_response_instance.to_dict()
# create an instance of AppStoreGetListing200Response from a dict
app_store_get_listing200_response_from_dict = AppStoreGetListing200Response.from_dict(app_store_get_listing200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


