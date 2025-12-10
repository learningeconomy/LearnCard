# InboxSendGuardianApprovalEmailRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**guardian_email** | **str** |  | 
**ttl_hours** | **int** |  | [optional] 
**template** | [**InboxSendGuardianApprovalEmailRequestTemplate**](InboxSendGuardianApprovalEmailRequestTemplate.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_send_guardian_approval_email_request import InboxSendGuardianApprovalEmailRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxSendGuardianApprovalEmailRequest from a JSON string
inbox_send_guardian_approval_email_request_instance = InboxSendGuardianApprovalEmailRequest.from_json(json)
# print the JSON string representation of the object
print(InboxSendGuardianApprovalEmailRequest.to_json())

# convert the object into a dict
inbox_send_guardian_approval_email_request_dict = inbox_send_guardian_approval_email_request_instance.to_dict()
# create an instance of InboxSendGuardianApprovalEmailRequest from a dict
inbox_send_guardian_approval_email_request_from_dict = InboxSendGuardianApprovalEmailRequest.from_dict(inbox_send_guardian_approval_email_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


