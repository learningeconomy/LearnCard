# AppStoreAssociateListingWithSigningAuthorityRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**endpoint** | **str** |  | 
**name** | **str** |  | 
**did** | **str** |  | 
**is_primary** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_associate_listing_with_signing_authority_request import AppStoreAssociateListingWithSigningAuthorityRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAssociateListingWithSigningAuthorityRequest from a JSON string
app_store_associate_listing_with_signing_authority_request_instance = AppStoreAssociateListingWithSigningAuthorityRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreAssociateListingWithSigningAuthorityRequest.to_json())

# convert the object into a dict
app_store_associate_listing_with_signing_authority_request_dict = app_store_associate_listing_with_signing_authority_request_instance.to_dict()
# create an instance of AppStoreAssociateListingWithSigningAuthorityRequest from a dict
app_store_associate_listing_with_signing_authority_request_from_dict = AppStoreAssociateListingWithSigningAuthorityRequest.from_dict(app_store_associate_listing_with_signing_authority_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


