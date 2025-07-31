# ErrorFORBIDDEN

The error information

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** | The error message | 
**code** | **str** | The error code | 
**issues** | [**List[ContactMethodsSetPrimaryContactMethod200Response]**](ContactMethodsSetPrimaryContactMethod200Response.md) | An array of issues that were responsible for the error | [optional] 

## Example

```python
from openapi_client.models.error_forbidden import ErrorFORBIDDEN

# TODO update the JSON string below
json = "{}"
# create an instance of ErrorFORBIDDEN from a JSON string
error_forbidden_instance = ErrorFORBIDDEN.from_json(json)
# print the JSON string representation of the object
print(ErrorFORBIDDEN.to_json())

# convert the object into a dict
error_forbidden_dict = error_forbidden_instance.to_dict()
# create an instance of ErrorFORBIDDEN from a dict
error_forbidden_from_dict = ErrorFORBIDDEN.from_dict(error_forbidden_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


