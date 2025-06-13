# AuthGrantsGetAuthGrantsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] 
**cursor** | **str** |  | [optional] 
**query** | [**AuthGrantsGetAuthGrantsRequestQuery**](AuthGrantsGetAuthGrantsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.auth_grants_get_auth_grants_request import AuthGrantsGetAuthGrantsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsGetAuthGrantsRequest from a JSON string
auth_grants_get_auth_grants_request_instance = AuthGrantsGetAuthGrantsRequest.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsGetAuthGrantsRequest.to_json())

# convert the object into a dict
auth_grants_get_auth_grants_request_dict = auth_grants_get_auth_grants_request_instance.to_dict()
# create an instance of AuthGrantsGetAuthGrantsRequest from a dict
auth_grants_get_auth_grants_request_from_dict = AuthGrantsGetAuthGrantsRequest.from_dict(auth_grants_get_auth_grants_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


