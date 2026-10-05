# ShareLinksRevokeRequest

## Properties

| Name                  | Type     | Description | Notes      |
| --------------------- | -------- | ----------- | ---------- |
| **id**                | **str**  |             |
| **expected_version**  | **int**  |             | [optional] |
| **client_request_id** | **UUID** |             | [optional] |

## Example

```python
from openapi_client.models.share_links_revoke_request import ShareLinksRevokeRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksRevokeRequest from a JSON string
share_links_revoke_request_instance = ShareLinksRevokeRequest.from_json(json)
# print the JSON string representation of the object
print(ShareLinksRevokeRequest.to_json())

# convert the object into a dict
share_links_revoke_request_dict = share_links_revoke_request_instance.to_dict()
# create an instance of ShareLinksRevokeRequest from a dict
share_links_revoke_request_from_dict = ShareLinksRevokeRequest.from_dict(share_links_revoke_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
