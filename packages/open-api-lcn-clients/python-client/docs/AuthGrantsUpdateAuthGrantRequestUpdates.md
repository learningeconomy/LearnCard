# AuthGrantsUpdateAuthGrantRequestUpdates


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
from openapi_client.models.auth_grants_update_auth_grant_request_updates import AuthGrantsUpdateAuthGrantRequestUpdates

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsUpdateAuthGrantRequestUpdates from a JSON string
auth_grants_update_auth_grant_request_updates_instance = AuthGrantsUpdateAuthGrantRequestUpdates.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsUpdateAuthGrantRequestUpdates.to_json())

# convert the object into a dict
auth_grants_update_auth_grant_request_updates_dict = auth_grants_update_auth_grant_request_updates_instance.to_dict()
# create an instance of AuthGrantsUpdateAuthGrantRequestUpdates from a dict
auth_grants_update_auth_grant_request_updates_from_dict = AuthGrantsUpdateAuthGrantRequestUpdates.from_dict(auth_grants_update_auth_grant_request_updates_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


