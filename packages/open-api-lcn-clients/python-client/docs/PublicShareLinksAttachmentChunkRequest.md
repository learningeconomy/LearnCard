# PublicShareLinksAttachmentChunkRequest

## Properties

| Name                | Type     | Description | Notes      |
| ------------------- | -------- | ----------- | ---------- |
| **id**              | **str**  |             |
| **content_version** | **int**  |             |
| **attachment_id**   | **UUID** |             |
| **chunk_index**     | **int**  |             |
| **passcode**        | **str**  |             | [optional] |
| **access_token**    | **str**  |             | [optional] |

## Example

```python
from openapi_client.models.public_share_links_attachment_chunk_request import PublicShareLinksAttachmentChunkRequest

# TODO update the JSON string below
json = "{}"
# create an instance of PublicShareLinksAttachmentChunkRequest from a JSON string
public_share_links_attachment_chunk_request_instance = PublicShareLinksAttachmentChunkRequest.from_json(json)
# print the JSON string representation of the object
print(PublicShareLinksAttachmentChunkRequest.to_json())

# convert the object into a dict
public_share_links_attachment_chunk_request_dict = public_share_links_attachment_chunk_request_instance.to_dict()
# create an instance of PublicShareLinksAttachmentChunkRequest from a dict
public_share_links_attachment_chunk_request_from_dict = PublicShareLinksAttachmentChunkRequest.from_dict(public_share_links_attachment_chunk_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
