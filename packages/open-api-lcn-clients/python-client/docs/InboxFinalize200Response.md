# InboxFinalize200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**processed** | **float** |  | 
**claimed** | **float** |  | 
**errors** | **float** |  | 
**verifiable_credentials** | [**List[StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOf1]**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOf1.md) |  | 

## Example

```python
from openapi_client.models.inbox_finalize200_response import InboxFinalize200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxFinalize200Response from a JSON string
inbox_finalize200_response_instance = InboxFinalize200Response.from_json(json)
# print the JSON string representation of the object
print(InboxFinalize200Response.to_json())

# convert the object into a dict
inbox_finalize200_response_dict = inbox_finalize200_response_instance.to_dict()
# create an instance of InboxFinalize200Response from a dict
inbox_finalize200_response_from_dict = InboxFinalize200Response.from_dict(inbox_finalize200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


