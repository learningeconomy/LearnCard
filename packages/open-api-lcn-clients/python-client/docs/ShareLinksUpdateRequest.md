# ShareLinksUpdateRequest

## Properties

| Name                         | Type                                                                                                      | Description | Notes      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **id**                       | **str**                                                                                                   |             |
| **expected_version**         | **int**                                                                                                   |             |
| **client_request_id**        | **UUID**                                                                                                  |             |
| **title**                    | **str**                                                                                                   |             | [optional] |
| **note**                     | **str**                                                                                                   |             | [optional] |
| **expires_at**               | **datetime**                                                                                              |             | [optional] |
| **passcode**                 | **str**                                                                                                   |             | [optional] |
| **notify_on_view**           | **bool**                                                                                                  |             | [optional] |
| **content_version**          | **int**                                                                                                   |             | [optional] |
| **selected_count**           | **int**                                                                                                   |             | [optional] |
| **envelope**                 | [**ShareLinksUpdateRequestEnvelope**](ShareLinksUpdateRequestEnvelope.md)                                 |             | [optional] |
| **owner_encrypted_recovery** | [**CredentialSendCredentialRequestCredentialAnyOf1**](CredentialSendCredentialRequestCredentialAnyOf1.md) |             | [optional] |

## Example

```python
from openapi_client.models.share_links_update_request import ShareLinksUpdateRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksUpdateRequest from a JSON string
share_links_update_request_instance = ShareLinksUpdateRequest.from_json(json)
# print the JSON string representation of the object
print(ShareLinksUpdateRequest.to_json())

# convert the object into a dict
share_links_update_request_dict = share_links_update_request_instance.to_dict()
# create an instance of ShareLinksUpdateRequest from a dict
share_links_update_request_from_dict = ShareLinksUpdateRequest.from_dict(share_links_update_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
