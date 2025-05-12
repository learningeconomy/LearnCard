# AuthGrantsGetAuthGrants200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**challenge** | **str** |  | 
**status** | **str** |  | 
**scope** | **str** |  | 
**created_at** | **datetime** |  | 
**expires_at** | **datetime** |  | [optional] 

## Example

```python
from openapi_client.models.auth_grants_get_auth_grants200_response_inner import AuthGrantsGetAuthGrants200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsGetAuthGrants200ResponseInner from a JSON string
auth_grants_get_auth_grants200_response_inner_instance = AuthGrantsGetAuthGrants200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsGetAuthGrants200ResponseInner.to_json())

# convert the object into a dict
auth_grants_get_auth_grants200_response_inner_dict = auth_grants_get_auth_grants200_response_inner_instance.to_dict()
# create an instance of AuthGrantsGetAuthGrants200ResponseInner from a dict
auth_grants_get_auth_grants200_response_inner_from_dict = AuthGrantsGetAuthGrants200ResponseInner.from_dict(auth_grants_get_auth_grants200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


