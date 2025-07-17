# ErrorNOTFOUND

The error information

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** | The error message | 
**code** | **str** | The error code | 
**issues** | [**List[ContactMethodsSetPrimaryContactMethod200Response]**](ContactMethodsSetPrimaryContactMethod200Response.md) | An array of issues that were responsible for the error | [optional] 

## Example

```python
from openapi_client.models.error_notfound import ErrorNOTFOUND

# TODO update the JSON string below
json = "{}"
# create an instance of ErrorNOTFOUND from a JSON string
error_notfound_instance = ErrorNOTFOUND.from_json(json)
# print the JSON string representation of the object
print(ErrorNOTFOUND.to_json())

# convert the object into a dict
error_notfound_dict = error_notfound_instance.to_dict()
# create an instance of ErrorNOTFOUND from a dict
error_notfound_from_dict = ErrorNOTFOUND.from_dict(error_notfound_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


