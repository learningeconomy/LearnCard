# AuthGrantsGetAuthGrant200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**challenge** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**scope** | **str** |  | [optional] 
**created_at** | **datetime** |  | [optional] 
**expires_at** | **datetime** |  | [optional] 

## Example

```python
from openapi_client.models.auth_grants_get_auth_grant200_response import AuthGrantsGetAuthGrant200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsGetAuthGrant200Response from a JSON string
auth_grants_get_auth_grant200_response_instance = AuthGrantsGetAuthGrant200Response.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsGetAuthGrant200Response.to_json())

# convert the object into a dict
auth_grants_get_auth_grant200_response_dict = auth_grants_get_auth_grant200_response_instance.to_dict()
# create an instance of AuthGrantsGetAuthGrant200Response from a dict
auth_grants_get_auth_grant200_response_from_dict = AuthGrantsGetAuthGrant200Response.from_dict(auth_grants_get_auth_grant200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


