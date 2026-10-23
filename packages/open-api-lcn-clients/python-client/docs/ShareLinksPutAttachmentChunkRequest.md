# ShareLinksPutAttachmentChunkRequest

## Properties

| Name                         | Type                                                                                                      | Description | Notes |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **id**                       | **str**                                                                                                   |             |
| **content_version**          | **int**                                                                                                   |             |
| **attachment_id**            | **UUID**                                                                                                  |             |
| **chunk_index**              | **int**                                                                                                   |             |
| **chunk_count**              | **int**                                                                                                   |             |
| **envelope**                 | [**ShareLinksPutAttachmentChunkRequestEnvelope**](ShareLinksPutAttachmentChunkRequestEnvelope.md)         |             |
| **owner_encrypted_recovery** | [**CredentialSendCredentialRequestCredentialAnyOf1**](CredentialSendCredentialRequestCredentialAnyOf1.md) |             |

## Example

```python
from openapi_client.models.share_links_put_attachment_chunk_request import ShareLinksPutAttachmentChunkRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksPutAttachmentChunkRequest from a JSON string
share_links_put_attachment_chunk_request_instance = ShareLinksPutAttachmentChunkRequest.from_json(json)
# print the JSON string representation of the object
print(ShareLinksPutAttachmentChunkRequest.to_json())

# convert the object into a dict
share_links_put_attachment_chunk_request_dict = share_links_put_attachment_chunk_request_instance.to_dict()
# create an instance of ShareLinksPutAttachmentChunkRequest from a dict
share_links_put_attachment_chunk_request_from_dict = ShareLinksPutAttachmentChunkRequest.from_dict(share_links_put_attachment_chunk_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
