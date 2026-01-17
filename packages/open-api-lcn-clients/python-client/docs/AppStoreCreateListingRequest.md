# AppStoreCreateListingRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**integration_id** | **str** |  | 
**listing** | [**AppStoreCreateListingRequestListing**](AppStoreCreateListingRequestListing.md) |  | 

## Example

```python
from openapi_client.models.app_store_create_listing_request import AppStoreCreateListingRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreCreateListingRequest from a JSON string
app_store_create_listing_request_instance = AppStoreCreateListingRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreCreateListingRequest.to_json())

# convert the object into a dict
app_store_create_listing_request_dict = app_store_create_listing_request_instance.to_dict()
# create an instance of AppStoreCreateListingRequest from a dict
app_store_create_listing_request_from_dict = AppStoreCreateListingRequest.from_dict(app_store_create_listing_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


