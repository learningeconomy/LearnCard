# AppStoreGetListingsForIntegrationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] 
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.app_store_get_listings_for_integration_request import AppStoreGetListingsForIntegrationRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListingsForIntegrationRequest from a JSON string
app_store_get_listings_for_integration_request_instance = AppStoreGetListingsForIntegrationRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListingsForIntegrationRequest.to_json())

# convert the object into a dict
app_store_get_listings_for_integration_request_dict = app_store_get_listings_for_integration_request_instance.to_dict()
# create an instance of AppStoreGetListingsForIntegrationRequest from a dict
app_store_get_listings_for_integration_request_from_dict = AppStoreGetListingsForIntegrationRequest.from_dict(app_store_get_listings_for_integration_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


