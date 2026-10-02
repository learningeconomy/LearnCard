# InboxGetGuardianPendingCredential200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**inbox_credential_id** | **str** |  | 
**guardian_status** | **str** |  | 
**issuer** | [**InboxGetGuardianPendingCredential200ResponseIssuer**](InboxGetGuardianPendingCredential200ResponseIssuer.md) |  | 
**credential_name** | **str** |  | [optional] 
**created_at** | **str** |  | 
**expires_at** | **str** |  | 
**can_approve_in_app** | **bool** |  | 

## Example

```python
from openapi_client.models.inbox_get_guardian_pending_credential200_response import InboxGetGuardianPendingCredential200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetGuardianPendingCredential200Response from a JSON string
inbox_get_guardian_pending_credential200_response_instance = InboxGetGuardianPendingCredential200Response.from_json(json)
# print the JSON string representation of the object
print(InboxGetGuardianPendingCredential200Response.to_json())

# convert the object into a dict
inbox_get_guardian_pending_credential200_response_dict = inbox_get_guardian_pending_credential200_response_instance.to_dict()
# create an instance of InboxGetGuardianPendingCredential200Response from a dict
inbox_get_guardian_pending_credential200_response_from_dict = InboxGetGuardianPendingCredential200Response.from_dict(inbox_get_guardian_pending_credential200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


