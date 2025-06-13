# AuthGrantsUpdateAuthGrantRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**updates** | [**AuthGrantsUpdateAuthGrantRequestUpdates**](AuthGrantsUpdateAuthGrantRequestUpdates.md) |  | 

## Example

```python
from openapi_client.models.auth_grants_update_auth_grant_request import AuthGrantsUpdateAuthGrantRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsUpdateAuthGrantRequest from a JSON string
auth_grants_update_auth_grant_request_instance = AuthGrantsUpdateAuthGrantRequest.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsUpdateAuthGrantRequest.to_json())

# convert the object into a dict
auth_grants_update_auth_grant_request_dict = auth_grants_update_auth_grant_request_instance.to_dict()
# create an instance of AuthGrantsUpdateAuthGrantRequest from a dict
auth_grants_update_auth_grant_request_from_dict = AuthGrantsUpdateAuthGrantRequest.from_dict(auth_grants_update_auth_grant_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


