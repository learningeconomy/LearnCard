# PublicShareLinksResolveRequest

## Properties

| Name         | Type    | Description | Notes      |
| ------------ | ------- | ----------- | ---------- |
| **passcode** | **str** |             | [optional] |

## Example

```python
from openapi_client.models.public_share_links_resolve_request import PublicShareLinksResolveRequest

# TODO update the JSON string below
json = "{}"
# create an instance of PublicShareLinksResolveRequest from a JSON string
public_share_links_resolve_request_instance = PublicShareLinksResolveRequest.from_json(json)
# print the JSON string representation of the object
print(PublicShareLinksResolveRequest.to_json())

# convert the object into a dict
public_share_links_resolve_request_dict = public_share_links_resolve_request_instance.to_dict()
# create an instance of PublicShareLinksResolveRequest from a dict
public_share_links_resolve_request_from_dict = PublicShareLinksResolveRequest.from_dict(public_share_links_resolve_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
