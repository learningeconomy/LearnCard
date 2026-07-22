# InboxApproveGuardianCredentialRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**otp_code** | **str** |  | 

## Example

```python
from openapi_client.models.inbox_approve_guardian_credential_request import InboxApproveGuardianCredentialRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxApproveGuardianCredentialRequest from a JSON string
inbox_approve_guardian_credential_request_instance = InboxApproveGuardianCredentialRequest.from_json(json)
# print the JSON string representation of the object
print(InboxApproveGuardianCredentialRequest.to_json())

# convert the object into a dict
inbox_approve_guardian_credential_request_dict = inbox_approve_guardian_credential_request_instance.to_dict()
# create an instance of InboxApproveGuardianCredentialRequest from a dict
inbox_approve_guardian_credential_request_from_dict = InboxApproveGuardianCredentialRequest.from_dict(inbox_approve_guardian_credential_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


