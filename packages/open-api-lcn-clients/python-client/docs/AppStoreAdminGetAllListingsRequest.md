# AppStoreAdminGetAllListingsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] 
**cursor** | **str** |  | [optional] 
**status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_admin_get_all_listings_request import AppStoreAdminGetAllListingsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAdminGetAllListingsRequest from a JSON string
app_store_admin_get_all_listings_request_instance = AppStoreAdminGetAllListingsRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreAdminGetAllListingsRequest.to_json())

# convert the object into a dict
app_store_admin_get_all_listings_request_dict = app_store_admin_get_all_listings_request_instance.to_dict()
# create an instance of AppStoreAdminGetAllListingsRequest from a dict
app_store_admin_get_all_listings_request_from_dict = AppStoreAdminGetAllListingsRequest.from_dict(app_store_admin_get_all_listings_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


