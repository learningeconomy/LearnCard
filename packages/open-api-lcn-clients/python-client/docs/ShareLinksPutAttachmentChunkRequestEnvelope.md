# ShareLinksPutAttachmentChunkRequestEnvelope

## Properties

| Name    | Type      | Description | Notes |
| ------- | --------- | ----------- | ----- |
| **v**   | **float** |             |
| **alg** | **str**   |             |
| **iv**  | **str**   |             |
| **ct**  | **str**   |             |

## Example

```python
from openapi_client.models.share_links_put_attachment_chunk_request_envelope import ShareLinksPutAttachmentChunkRequestEnvelope

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksPutAttachmentChunkRequestEnvelope from a JSON string
share_links_put_attachment_chunk_request_envelope_instance = ShareLinksPutAttachmentChunkRequestEnvelope.from_json(json)
# print the JSON string representation of the object
print(ShareLinksPutAttachmentChunkRequestEnvelope.to_json())

# convert the object into a dict
share_links_put_attachment_chunk_request_envelope_dict = share_links_put_attachment_chunk_request_envelope_instance.to_dict()
# create an instance of ShareLinksPutAttachmentChunkRequestEnvelope from a dict
share_links_put_attachment_chunk_request_envelope_from_dict = ShareLinksPutAttachmentChunkRequestEnvelope.from_dict(share_links_put_attachment_chunk_request_envelope_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
