# AuthGrantsAddAuthGrantRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**challenge** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**scope** | **str** |  | [optional] 
**created_at** | **datetime** |  | [optional] 
**expires_at** | **datetime** |  | [optional] 

## Example

```python
from openapi_client.models.auth_grants_add_auth_grant_request import AuthGrantsAddAuthGrantRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsAddAuthGrantRequest from a JSON string
auth_grants_add_auth_grant_request_instance = AuthGrantsAddAuthGrantRequest.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsAddAuthGrantRequest.to_json())

# convert the object into a dict
auth_grants_add_auth_grant_request_dict = auth_grants_add_auth_grant_request_instance.to_dict()
# create an instance of AuthGrantsAddAuthGrantRequest from a dict
auth_grants_add_auth_grant_request_from_dict = AuthGrantsAddAuthGrantRequest.from_dict(auth_grants_add_auth_grant_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


