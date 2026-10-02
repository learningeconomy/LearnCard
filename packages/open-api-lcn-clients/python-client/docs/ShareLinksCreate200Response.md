# ShareLinksCreate200Response

## Properties

| Name             | Type                                                                                  | Description | Notes |
| ---------------- | ------------------------------------------------------------------------------------- | ----------- | ----- |
| **status**       | **str**                                                                               |             |
| **share**        | [**ShareLinksCreate200ResponseOneOfShare**](ShareLinksCreate200ResponseOneOfShare.md) |             |
| **id**           | **str**                                                                               |             |
| **operation_id** | **UUID**                                                                              |             |

## Example

```python
from openapi_client.models.share_links_create200_response import ShareLinksCreate200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksCreate200Response from a JSON string
share_links_create200_response_instance = ShareLinksCreate200Response.from_json(json)
# print the JSON string representation of the object
print(ShareLinksCreate200Response.to_json())

# convert the object into a dict
share_links_create200_response_dict = share_links_create200_response_instance.to_dict()
# create an instance of ShareLinksCreate200Response from a dict
share_links_create200_response_from_dict = ShareLinksCreate200Response.from_dict(share_links_create200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
