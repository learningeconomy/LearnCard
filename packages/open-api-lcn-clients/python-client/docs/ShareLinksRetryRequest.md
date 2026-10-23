# ShareLinksRetryRequest

## Properties

| Name             | Type     | Description | Notes |
| ---------------- | -------- | ----------- | ----- |
| **id**           | **str**  |             |
| **operation_id** | **UUID** |             |

## Example

```python
from openapi_client.models.share_links_retry_request import ShareLinksRetryRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksRetryRequest from a JSON string
share_links_retry_request_instance = ShareLinksRetryRequest.from_json(json)
# print the JSON string representation of the object
print(ShareLinksRetryRequest.to_json())

# convert the object into a dict
share_links_retry_request_dict = share_links_retry_request_instance.to_dict()
# create an instance of ShareLinksRetryRequest from a dict
share_links_retry_request_from_dict = ShareLinksRetryRequest.from_dict(share_links_retry_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
