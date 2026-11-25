# ShareLinksUpdateRequestAttachment

## Properties

| Name            | Type     | Description | Notes |
| --------------- | -------- | ----------- | ----- |
| **id**          | **UUID** |             |
| **chunk_count** | **int**  |             |

## Example

```python
from openapi_client.models.share_links_update_request_attachment import ShareLinksUpdateRequestAttachment

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksUpdateRequestAttachment from a JSON string
share_links_update_request_attachment_instance = ShareLinksUpdateRequestAttachment.from_json(json)
# print the JSON string representation of the object
print(ShareLinksUpdateRequestAttachment.to_json())

# convert the object into a dict
share_links_update_request_attachment_dict = share_links_update_request_attachment_instance.to_dict()
# create an instance of ShareLinksUpdateRequestAttachment from a dict
share_links_update_request_attachment_from_dict = ShareLinksUpdateRequestAttachment.from_dict(share_links_update_request_attachment_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
