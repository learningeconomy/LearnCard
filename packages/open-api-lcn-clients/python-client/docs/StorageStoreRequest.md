# StorageStoreRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**item** | [**StorageStoreRequestItem**](StorageStoreRequestItem.md) |  | 
**type** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.storage_store_request import StorageStoreRequest

# TODO update the JSON string below
json = "{}"
# create an instance of StorageStoreRequest from a JSON string
storage_store_request_instance = StorageStoreRequest.from_json(json)
# print the JSON string representation of the object
print(StorageStoreRequest.to_json())

# convert the object into a dict
storage_store_request_dict = storage_store_request_instance.to_dict()
# create an instance of StorageStoreRequest from a dict
storage_store_request_from_dict = StorageStoreRequest.from_dict(storage_store_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


