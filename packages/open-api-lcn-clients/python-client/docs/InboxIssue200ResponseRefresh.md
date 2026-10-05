# InboxIssue200ResponseRefresh

## Properties

| Name                  | Type                                                                                                                | Description | Notes      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **refresh_id**        | **str**                                                                                                             |             |
| **refresh_service**   | [**BoostSend200ResponseInboxRefreshRefreshService**](BoostSend200ResponseInboxRefreshRefreshService.md)             |             |
| **credential_id**     | **str**                                                                                                             |             |
| **issuer_did**        | **str**                                                                                                             |             |
| **credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |             | [optional] |
| **holder_did**        | **str**                                                                                                             |             | [optional] |

## Example

```python
from openapi_client.models.inbox_issue200_response_refresh import InboxIssue200ResponseRefresh

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssue200ResponseRefresh from a JSON string
inbox_issue200_response_refresh_instance = InboxIssue200ResponseRefresh.from_json(json)
# print the JSON string representation of the object
print(InboxIssue200ResponseRefresh.to_json())

# convert the object into a dict
inbox_issue200_response_refresh_dict = inbox_issue200_response_refresh_instance.to_dict()
# create an instance of InboxIssue200ResponseRefresh from a dict
inbox_issue200_response_refresh_from_dict = InboxIssue200ResponseRefresh.from_dict(inbox_issue200_response_refresh_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
