# AppStoreUpdateListingRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**updates** | [**AppStoreUpdateListingRequestUpdates**](AppStoreUpdateListingRequestUpdates.md) |  | 

## Example

```python
from openapi_client.models.app_store_update_listing_request import AppStoreUpdateListingRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreUpdateListingRequest from a JSON string
app_store_update_listing_request_instance = AppStoreUpdateListingRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreUpdateListingRequest.to_json())

# convert the object into a dict
app_store_update_listing_request_dict = app_store_update_listing_request_instance.to_dict()
# create an instance of AppStoreUpdateListingRequest from a dict
app_store_update_listing_request_from_dict = AppStoreUpdateListingRequest.from_dict(app_store_update_listing_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


