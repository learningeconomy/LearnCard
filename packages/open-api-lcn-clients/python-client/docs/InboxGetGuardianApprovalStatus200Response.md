# InboxGetGuardianApprovalStatus200Response

## Properties

| Name                    | Type     | Description                                                                                                                                                      | Notes      |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **pending_approval**    | **bool** |                                                                                                                                                                  |
| **status**              | **str**  | Outcome of the latest account-level guardian approval email. \&quot;accepted\&quot; means the email provider accepted the message; it does not confirm delivery. |
| **guardian_email**      | **str**  |                                                                                                                                                                  | [optional] |
| **updated_at**          | **str**  |                                                                                                                                                                  | [optional] |
| **link_expires_at**     | **str**  |                                                                                                                                                                  | [optional] |
| **resend_available_at** | **str**  |                                                                                                                                                                  | [optional] |
| **attempts_remaining**  | **int**  |                                                                                                                                                                  |

## Example

```python
from openapi_client.models.inbox_get_guardian_approval_status200_response import InboxGetGuardianApprovalStatus200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetGuardianApprovalStatus200Response from a JSON string
inbox_get_guardian_approval_status200_response_instance = InboxGetGuardianApprovalStatus200Response.from_json(json)
# print the JSON string representation of the object
print(InboxGetGuardianApprovalStatus200Response.to_json())

# convert the object into a dict
inbox_get_guardian_approval_status200_response_dict = inbox_get_guardian_approval_status200_response_instance.to_dict()
# create an instance of InboxGetGuardianApprovalStatus200Response from a dict
inbox_get_guardian_approval_status200_response_from_dict = InboxGetGuardianApprovalStatus200Response.from_dict(inbox_get_guardian_approval_status200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
