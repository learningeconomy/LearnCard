# PublicShareLinksAttachmentChunk200Response

## Properties

| Name                | Type                                                                      | Description | Notes      |
| ------------------- | ------------------------------------------------------------------------- | ----------- | ---------- |
| **id**              | **str**                                                                   |             |
| **content_version** | **int**                                                                   |             |
| **attachment_id**   | **UUID**                                                                  |             |
| **chunk_index**     | **int**                                                                   |             |
| **envelope**        | [**ShareLinksCreateRequestEnvelope**](ShareLinksCreateRequestEnvelope.md) |             |
| **access_token**    | **str**                                                                   |             | [optional] |

## Example

```python
from openapi_client.models.public_share_links_attachment_chunk200_response import PublicShareLinksAttachmentChunk200Response

# TODO update the JSON string below
json = "{}"
# create an instance of PublicShareLinksAttachmentChunk200Response from a JSON string
public_share_links_attachment_chunk200_response_instance = PublicShareLinksAttachmentChunk200Response.from_json(json)
# print the JSON string representation of the object
print(PublicShareLinksAttachmentChunk200Response.to_json())

# convert the object into a dict
public_share_links_attachment_chunk200_response_dict = public_share_links_attachment_chunk200_response_instance.to_dict()
# create an instance of PublicShareLinksAttachmentChunk200Response from a dict
public_share_links_attachment_chunk200_response_from_dict = PublicShareLinksAttachmentChunk200Response.from_dict(public_share_links_attachment_chunk200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
