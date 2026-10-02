# ShareLinksCreateRequest

## Properties

| Name                         | Type                                                                                                      | Description | Notes                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------- |
| **id**                       | **str**                                                                                                   |             |
| **client_request_id**        | **UUID**                                                                                                  |             |
| **title**                    | **str**                                                                                                   |             |
| **note**                     | **str**                                                                                                   |             | [optional]                    |
| **expires_at**               | **datetime**                                                                                              |             | [optional]                    |
| **passcode**                 | **str**                                                                                                   |             | [optional]                    |
| **notify_on_view**           | **bool**                                                                                                  |             | [optional] [default to False] |
| **selected_count**           | **int**                                                                                                   |             |
| **content_version**          | **float**                                                                                                 |             |
| **envelope**                 | [**ShareLinksCreateRequestEnvelope**](ShareLinksCreateRequestEnvelope.md)                                 |             |
| **owner_encrypted_recovery** | [**CredentialSendCredentialRequestCredentialAnyOf1**](CredentialSendCredentialRequestCredentialAnyOf1.md) |             |

## Example

```python
from openapi_client.models.share_links_create_request import ShareLinksCreateRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksCreateRequest from a JSON string
share_links_create_request_instance = ShareLinksCreateRequest.from_json(json)
# print the JSON string representation of the object
print(ShareLinksCreateRequest.to_json())

# convert the object into a dict
share_links_create_request_dict = share_links_create_request_instance.to_dict()
# create an instance of ShareLinksCreateRequest from a dict
share_links_create_request_from_dict = ShareLinksCreateRequest.from_dict(share_links_create_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
