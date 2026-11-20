# CredentialRefreshGetEncryptionRecipients200Response

## Properties

| Name                  | Type          | Description | Notes |
| --------------------- | ------------- | ----------- | ----- |
| **recipient_key_ids** | **List[str]** |             |

## Example

```python
from openapi_client.models.credential_refresh_get_encryption_recipients200_response import CredentialRefreshGetEncryptionRecipients200Response

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshGetEncryptionRecipients200Response from a JSON string
credential_refresh_get_encryption_recipients200_response_instance = CredentialRefreshGetEncryptionRecipients200Response.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshGetEncryptionRecipients200Response.to_json())

# convert the object into a dict
credential_refresh_get_encryption_recipients200_response_dict = credential_refresh_get_encryption_recipients200_response_instance.to_dict()
# create an instance of CredentialRefreshGetEncryptionRecipients200Response from a dict
credential_refresh_get_encryption_recipients200_response_from_dict = CredentialRefreshGetEncryptionRecipients200Response.from_dict(credential_refresh_get_encryption_recipients200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
