# ShareLinksDeleteAttachmentChunksRequest

## Properties

| Name                | Type     | Description | Notes |
| ------------------- | -------- | ----------- | ----- |
| **id**              | **str**  |             |
| **content_version** | **int**  |             |
| **attachment_id**   | **UUID** |             |
| **chunk_count**     | **int**  |             |

## Example

```python
from openapi_client.models.share_links_delete_attachment_chunks_request import ShareLinksDeleteAttachmentChunksRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksDeleteAttachmentChunksRequest from a JSON string
share_links_delete_attachment_chunks_request_instance = ShareLinksDeleteAttachmentChunksRequest.from_json(json)
# print the JSON string representation of the object
print(ShareLinksDeleteAttachmentChunksRequest.to_json())

# convert the object into a dict
share_links_delete_attachment_chunks_request_dict = share_links_delete_attachment_chunks_request_instance.to_dict()
# create an instance of ShareLinksDeleteAttachmentChunksRequest from a dict
share_links_delete_attachment_chunks_request_from_dict = ShareLinksDeleteAttachmentChunksRequest.from_dict(share_links_delete_attachment_chunks_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
