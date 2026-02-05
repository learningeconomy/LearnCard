# AppStoreAddBoostToListingRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**template_alias** | **str** |  | 

## Example

```python
from openapi_client.models.app_store_add_boost_to_listing_request import AppStoreAddBoostToListingRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAddBoostToListingRequest from a JSON string
app_store_add_boost_to_listing_request_instance = AppStoreAddBoostToListingRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreAddBoostToListingRequest.to_json())

# convert the object into a dict
app_store_add_boost_to_listing_request_dict = app_store_add_boost_to_listing_request_instance.to_dict()
# create an instance of AppStoreAddBoostToListingRequest from a dict
app_store_add_boost_to_listing_request_from_dict = AppStoreAddBoostToListingRequest.from_dict(app_store_add_boost_to_listing_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


