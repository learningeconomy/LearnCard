# CredentialRefreshPublishHolderEncryptedRefreshableRequest

## Properties

| Name                | Type                                                                                                                                        | Description                                                                       | Notes      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| **handoff**         | [**CredentialRefreshPublishHolderEncryptedRefreshableRequestHandoff**](CredentialRefreshPublishHolderEncryptedRefreshableRequestHandoff.md) |                                                                                   |
| **notify**          | **bool**                                                                                                                                    |                                                                                   |
| **update_summary**  | **str**                                                                                                                                     | Public legacy update summary. Do not include private claims; prefer updateReason. | [optional] |
| **update_reason**   | **str**                                                                                                                                     | Public reason for this update                                                     | [optional] |
| **idempotency_key** | **str**                                                                                                                                     |                                                                                   | [optional] |

## Example

```python
from openapi_client.models.credential_refresh_publish_holder_encrypted_refreshable_request import CredentialRefreshPublishHolderEncryptedRefreshableRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshPublishHolderEncryptedRefreshableRequest from a JSON string
credential_refresh_publish_holder_encrypted_refreshable_request_instance = CredentialRefreshPublishHolderEncryptedRefreshableRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshPublishHolderEncryptedRefreshableRequest.to_json())

# convert the object into a dict
credential_refresh_publish_holder_encrypted_refreshable_request_dict = credential_refresh_publish_holder_encrypted_refreshable_request_instance.to_dict()
# create an instance of CredentialRefreshPublishHolderEncryptedRefreshableRequest from a dict
credential_refresh_publish_holder_encrypted_refreshable_request_from_dict = CredentialRefreshPublishHolderEncryptedRefreshableRequest.from_dict(credential_refresh_publish_holder_encrypted_refreshable_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
