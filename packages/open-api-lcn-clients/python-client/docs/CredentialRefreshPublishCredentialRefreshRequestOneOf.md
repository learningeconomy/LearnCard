# CredentialRefreshPublishCredentialRefreshRequestOneOf

## Properties

| Name                  | Type                                                                                      | Description | Notes      |
| --------------------- | ----------------------------------------------------------------------------------------- | ----------- | ---------- |
| **refresh_id**        | **str**                                                                                   |             |
| **notify_holder**     | **bool**                                                                                  |             | [optional] |
| **update_summary**    | **str**                                                                                   |             | [optional] |
| **idempotency_key**   | **str**                                                                                   |             | [optional] |
| **mode**              | **str**                                                                                   |             |
| **signed_credential** | [**BoostSendRequestTemplateCredentialAnyOf**](BoostSendRequestTemplateCredentialAnyOf.md) |             |

## Example

```python
from openapi_client.models.credential_refresh_publish_credential_refresh_request_one_of import CredentialRefreshPublishCredentialRefreshRequestOneOf

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshPublishCredentialRefreshRequestOneOf from a JSON string
credential_refresh_publish_credential_refresh_request_one_of_instance = CredentialRefreshPublishCredentialRefreshRequestOneOf.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshPublishCredentialRefreshRequestOneOf.to_json())

# convert the object into a dict
credential_refresh_publish_credential_refresh_request_one_of_dict = credential_refresh_publish_credential_refresh_request_one_of_instance.to_dict()
# create an instance of CredentialRefreshPublishCredentialRefreshRequestOneOf from a dict
credential_refresh_publish_credential_refresh_request_one_of_from_dict = CredentialRefreshPublishCredentialRefreshRequestOneOf.from_dict(credential_refresh_publish_credential_refresh_request_one_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
