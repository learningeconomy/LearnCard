# StorageResolve200ResponseAnyOfAnyOfAnyOf1


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[StorageResolve200ResponseAnyOfAnyOfAnyOf1RecipientsInner]**](StorageResolve200ResponseAnyOfAnyOfAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of_any_of_any_of1 import StorageResolve200ResponseAnyOfAnyOfAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOf1 from a JSON string
storage_resolve200_response_any_of_any_of_any_of1_instance = StorageResolve200ResponseAnyOfAnyOfAnyOf1.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOfAnyOfAnyOf1.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_any_of_any_of1_dict = storage_resolve200_response_any_of_any_of_any_of1_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOf1 from a dict
storage_resolve200_response_any_of_any_of_any_of1_from_dict = StorageResolve200ResponseAnyOfAnyOfAnyOf1.from_dict(storage_resolve200_response_any_of_any_of_any_of1_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


