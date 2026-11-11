# PublicShareLinksResolve200Response

## Properties

| Name                | Type                                                                                                    | Description | Notes      |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **state**           | **str**                                                                                                 |             |
| **id**              | **str**                                                                                                 |             |
| **title**           | **str**                                                                                                 |             |
| **note**            | **str**                                                                                                 |             | [optional] |
| **selected_count**  | **int**                                                                                                 |             |
| **content_version** | **int**                                                                                                 |             |
| **content_url**     | **str**                                                                                                 |             |
| **sharer**          | [**PublicShareLinksResolve200ResponseOneOf2Sharer**](PublicShareLinksResolve200ResponseOneOf2Sharer.md) |             |
| **created_at**      | **datetime**                                                                                            |             |
| **updated_at**      | **datetime**                                                                                            |             |
| **expires_at**      | **datetime**                                                                                            |             |
| **stopped_at**      | **datetime**                                                                                            |             |

## Example

```python
from openapi_client.models.public_share_links_resolve200_response import PublicShareLinksResolve200Response

# TODO update the JSON string below
json = "{}"
# create an instance of PublicShareLinksResolve200Response from a JSON string
public_share_links_resolve200_response_instance = PublicShareLinksResolve200Response.from_json(json)
# print the JSON string representation of the object
print(PublicShareLinksResolve200Response.to_json())

# convert the object into a dict
public_share_links_resolve200_response_dict = public_share_links_resolve200_response_instance.to_dict()
# create an instance of PublicShareLinksResolve200Response from a dict
public_share_links_resolve200_response_from_dict = PublicShareLinksResolve200Response.from_dict(public_share_links_resolve200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
