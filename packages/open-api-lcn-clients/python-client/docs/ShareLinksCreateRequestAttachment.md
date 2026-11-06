# ShareLinksCreateRequestAttachment

## Properties

| Name            | Type     | Description | Notes |
| --------------- | -------- | ----------- | ----- |
| **id**          | **UUID** |             |
| **chunk_count** | **int**  |             |

## Example

```python
from openapi_client.models.share_links_create_request_attachment import ShareLinksCreateRequestAttachment

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksCreateRequestAttachment from a JSON string
share_links_create_request_attachment_instance = ShareLinksCreateRequestAttachment.from_json(json)
# print the JSON string representation of the object
print(ShareLinksCreateRequestAttachment.to_json())

# convert the object into a dict
share_links_create_request_attachment_dict = share_links_create_request_attachment_instance.to_dict()
# create an instance of ShareLinksCreateRequestAttachment from a dict
share_links_create_request_attachment_from_dict = ShareLinksCreateRequestAttachment.from_dict(share_links_create_request_attachment_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
