# StorageResolve200ResponseAnyOf1Read


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**StorageResolve200ResponseAnyOf1ReadCredentials**](StorageResolve200ResponseAnyOf1ReadCredentials.md) |  | [optional] 
**personal** | **Dict[str, str]** |  | [optional] 

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of1_read import StorageResolve200ResponseAnyOf1Read

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOf1Read from a JSON string
storage_resolve200_response_any_of1_read_instance = StorageResolve200ResponseAnyOf1Read.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOf1Read.to_json())

# convert the object into a dict
storage_resolve200_response_any_of1_read_dict = storage_resolve200_response_any_of1_read_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOf1Read from a dict
storage_resolve200_response_any_of1_read_from_dict = StorageResolve200ResponseAnyOf1Read.from_dict(storage_resolve200_response_any_of1_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


