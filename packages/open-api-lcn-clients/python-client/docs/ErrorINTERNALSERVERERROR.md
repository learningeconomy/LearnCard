# ErrorINTERNALSERVERERROR

The error information

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** | The error message | 
**code** | **str** | The error code | 
**issues** | [**List[ContactMethodsSetPrimaryContactMethod200Response]**](ContactMethodsSetPrimaryContactMethod200Response.md) | An array of issues that were responsible for the error | [optional] 

## Example

```python
from openapi_client.models.error_internalservererror import ErrorINTERNALSERVERERROR

# TODO update the JSON string below
json = "{}"
# create an instance of ErrorINTERNALSERVERERROR from a JSON string
error_internalservererror_instance = ErrorINTERNALSERVERERROR.from_json(json)
# print the JSON string representation of the object
print(ErrorINTERNALSERVERERROR.to_json())

# convert the object into a dict
error_internalservererror_dict = error_internalservererror_instance.to_dict()
# create an instance of ErrorINTERNALSERVERERROR from a dict
error_internalservererror_from_dict = ErrorINTERNALSERVERERROR.from_dict(error_internalservererror_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


