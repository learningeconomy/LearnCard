# ErrorUNAUTHORIZED

The error information

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** | The error message | 
**code** | **str** | The error code | 
**issues** | [**List[ErrorBADREQUESTIssuesInner]**](ErrorBADREQUESTIssuesInner.md) | An array of issues that were responsible for the error | [optional] 

## Example

```python
from openapi_client.models.error_unauthorized import ErrorUNAUTHORIZED

# TODO update the JSON string below
json = "{}"
# create an instance of ErrorUNAUTHORIZED from a JSON string
error_unauthorized_instance = ErrorUNAUTHORIZED.from_json(json)
# print the JSON string representation of the object
print(ErrorUNAUTHORIZED.to_json())

# convert the object into a dict
error_unauthorized_dict = error_unauthorized_instance.to_dict()
# create an instance of ErrorUNAUTHORIZED from a dict
error_unauthorized_from_dict = ErrorUNAUTHORIZED.from_dict(error_unauthorized_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


