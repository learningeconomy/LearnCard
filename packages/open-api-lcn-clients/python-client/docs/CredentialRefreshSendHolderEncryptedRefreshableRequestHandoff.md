# CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff

## Properties

| Name                  | Type                                                                                                            | Description | Notes      |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **refresh_id**        | **str**                                                                                                         |             |
| **credential_id**     | **str**                                                                                                         |             |
| **holder_did**        | **str**                                                                                                         |             |
| **issuer_did**        | **str**                                                                                                         |             |
| **credential_status** | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md) |             |
| **refresh_service**   | [**BoostSend200ResponseInboxRefreshRefreshService**](BoostSend200ResponseInboxRefreshRefreshService.md)         |             | [optional] |
| **jwe**               | [**BoostSendBoostRequestCredentialAnyOf1**](BoostSendBoostRequestCredentialAnyOf1.md)                           |             |

## Example

```python
from openapi_client.models.credential_refresh_send_holder_encrypted_refreshable_request_handoff import CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff from a JSON string
credential_refresh_send_holder_encrypted_refreshable_request_handoff_instance = CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff.to_json())

# convert the object into a dict
credential_refresh_send_holder_encrypted_refreshable_request_handoff_dict = credential_refresh_send_holder_encrypted_refreshable_request_handoff_instance.to_dict()
# create an instance of CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff from a dict
credential_refresh_send_holder_encrypted_refreshable_request_handoff_from_dict = CredentialRefreshSendHolderEncryptedRefreshableRequestHandoff.from_dict(credential_refresh_send_holder_encrypted_refreshable_request_handoff_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
