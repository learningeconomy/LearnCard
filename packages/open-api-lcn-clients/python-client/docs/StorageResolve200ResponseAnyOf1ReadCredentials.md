# StorageResolve200ResponseAnyOf1ReadCredentials


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**share_all** | **bool** |  | [optional] 
**sharing** | **bool** |  | [optional] 
**categories** | [**Dict[str, StorageResolve200ResponseAnyOf1ReadCredentialsCategoriesValue]**](StorageResolve200ResponseAnyOf1ReadCredentialsCategoriesValue.md) |  | 

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of1_read_credentials import StorageResolve200ResponseAnyOf1ReadCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOf1ReadCredentials from a JSON string
storage_resolve200_response_any_of1_read_credentials_instance = StorageResolve200ResponseAnyOf1ReadCredentials.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOf1ReadCredentials.to_json())

# convert the object into a dict
storage_resolve200_response_any_of1_read_credentials_dict = storage_resolve200_response_any_of1_read_credentials_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOf1ReadCredentials from a dict
storage_resolve200_response_any_of1_read_credentials_from_dict = StorageResolve200ResponseAnyOf1ReadCredentials.from_dict(storage_resolve200_response_any_of1_read_credentials_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


