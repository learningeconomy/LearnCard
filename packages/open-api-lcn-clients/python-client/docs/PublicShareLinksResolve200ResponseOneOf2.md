# PublicShareLinksResolve200ResponseOneOf2

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

## Example

```python
from openapi_client.models.public_share_links_resolve200_response_one_of2 import PublicShareLinksResolve200ResponseOneOf2

# TODO update the JSON string below
json = "{}"
# create an instance of PublicShareLinksResolve200ResponseOneOf2 from a JSON string
public_share_links_resolve200_response_one_of2_instance = PublicShareLinksResolve200ResponseOneOf2.from_json(json)
# print the JSON string representation of the object
print(PublicShareLinksResolve200ResponseOneOf2.to_json())

# convert the object into a dict
public_share_links_resolve200_response_one_of2_dict = public_share_links_resolve200_response_one_of2_instance.to_dict()
# create an instance of PublicShareLinksResolve200ResponseOneOf2 from a dict
public_share_links_resolve200_response_one_of2_from_dict = PublicShareLinksResolve200ResponseOneOf2.from_dict(public_share_links_resolve200_response_one_of2_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
