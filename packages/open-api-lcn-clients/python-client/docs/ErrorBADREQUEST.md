# ErrorBADREQUEST

The error information

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** | The error message | 
**code** | **str** | The error code | 
**issues** | [**List[ErrorBADREQUESTIssuesInner]**](ErrorBADREQUESTIssuesInner.md) | An array of issues that were responsible for the error | [optional] 

## Example

```python
from openapi_client.models.error_badrequest import ErrorBADREQUEST

# TODO update the JSON string below
json = "{}"
# create an instance of ErrorBADREQUEST from a JSON string
error_badrequest_instance = ErrorBADREQUEST.from_json(json)
# print the JSON string representation of the object
print(ErrorBADREQUEST.to_json())

# convert the object into a dict
error_badrequest_dict = error_badrequest_instance.to_dict()
# create an instance of ErrorBADREQUEST from a dict
error_badrequest_from_dict = ErrorBADREQUEST.from_dict(error_badrequest_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


