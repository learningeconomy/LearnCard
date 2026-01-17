# AppStoreGetListingsForIntegration200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**has_more** | **bool** |  | 
**cursor** | **str** |  | [optional] 
**records** | [**List[AppStoreGetListingsForIntegration200ResponseRecordsInner]**](AppStoreGetListingsForIntegration200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.app_store_get_listings_for_integration200_response import AppStoreGetListingsForIntegration200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListingsForIntegration200Response from a JSON string
app_store_get_listings_for_integration200_response_instance = AppStoreGetListingsForIntegration200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListingsForIntegration200Response.to_json())

# convert the object into a dict
app_store_get_listings_for_integration200_response_dict = app_store_get_listings_for_integration200_response_instance.to_dict()
# create an instance of AppStoreGetListingsForIntegration200Response from a dict
app_store_get_listings_for_integration200_response_from_dict = AppStoreGetListingsForIntegration200Response.from_dict(app_store_get_listings_for_integration200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


