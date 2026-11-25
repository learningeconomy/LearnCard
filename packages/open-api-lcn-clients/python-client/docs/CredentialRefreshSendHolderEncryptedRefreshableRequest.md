# CredentialRefreshSendHolderEncryptedRefreshableRequest

## Properties

| Name                  | Type                                                                                                                                  | Description | Notes      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **handoff**           | [**CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff**](CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff.md) |             |
| **idempotency_key**   | **str**                                                                                                                               |             | [optional] |
| **boost_uri**         | **str**                                                                                                                               |             | [optional] |
| **skip_notification** | **bool**                                                                                                                              |             | [optional] |

## Example

```python
from openapi_client.models.credential_refresh_send_holder_encrypted_refreshable_request import CredentialRefreshSendHolderEncryptedRefreshableRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshSendHolderEncryptedRefreshableRequest from a JSON string
credential_refresh_send_holder_encrypted_refreshable_request_instance = CredentialRefreshSendHolderEncryptedRefreshableRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshSendHolderEncryptedRefreshableRequest.to_json())

# convert the object into a dict
credential_refresh_send_holder_encrypted_refreshable_request_dict = credential_refresh_send_holder_encrypted_refreshable_request_instance.to_dict()
# create an instance of CredentialRefreshSendHolderEncryptedRefreshableRequest from a dict
credential_refresh_send_holder_encrypted_refreshable_request_from_dict = CredentialRefreshSendHolderEncryptedRefreshableRequest.from_dict(credential_refresh_send_holder_encrypted_refreshable_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
