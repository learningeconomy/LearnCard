# InboxRejectGuardianCredentialRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**otp_code** | **str** |  | 

## Example

```python
from openapi_client.models.inbox_reject_guardian_credential_request import InboxRejectGuardianCredentialRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxRejectGuardianCredentialRequest from a JSON string
inbox_reject_guardian_credential_request_instance = InboxRejectGuardianCredentialRequest.from_json(json)
# print the JSON string representation of the object
print(InboxRejectGuardianCredentialRequest.to_json())

# convert the object into a dict
inbox_reject_guardian_credential_request_dict = inbox_reject_guardian_credential_request_instance.to_dict()
# create an instance of InboxRejectGuardianCredentialRequest from a dict
inbox_reject_guardian_credential_request_from_dict = InboxRejectGuardianCredentialRequest.from_dict(inbox_reject_guardian_credential_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


