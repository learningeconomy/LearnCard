# AppStoreGetListingSigningAuthority200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**endpoint** | **str** |  | 
**name** | **str** |  | 
**did** | **str** |  | 
**is_primary** | **bool** |  | 

## Example

```python
from openapi_client.models.app_store_get_listing_signing_authority200_response import AppStoreGetListingSigningAuthority200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListingSigningAuthority200Response from a JSON string
app_store_get_listing_signing_authority200_response_instance = AppStoreGetListingSigningAuthority200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListingSigningAuthority200Response.to_json())

# convert the object into a dict
app_store_get_listing_signing_authority200_response_dict = app_store_get_listing_signing_authority200_response_instance.to_dict()
# create an instance of AppStoreGetListingSigningAuthority200Response from a dict
app_store_get_listing_signing_authority200_response_from_dict = AppStoreGetListingSigningAuthority200Response.from_dict(app_store_get_listing_signing_authority200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


