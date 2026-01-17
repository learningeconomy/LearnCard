# AppStoreCreateListingRequestListing


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**display_name** | **str** |  | 
**tagline** | **str** |  | 
**full_description** | **str** |  | 
**icon_url** | **str** |  | 
**launch_type** | **str** |  | 
**launch_config_json** | **str** |  | 
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
from openapi_client.models.app_store_create_listing_request_listing import AppStoreCreateListingRequestListing

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreCreateListingRequestListing from a JSON string
app_store_create_listing_request_listing_instance = AppStoreCreateListingRequestListing.from_json(json)
# print the JSON string representation of the object
print(AppStoreCreateListingRequestListing.to_json())

# convert the object into a dict
app_store_create_listing_request_listing_dict = app_store_create_listing_request_listing_instance.to_dict()
# create an instance of AppStoreCreateListingRequestListing from a dict
app_store_create_listing_request_listing_from_dict = AppStoreCreateListingRequestListing.from_dict(app_store_create_listing_request_listing_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


