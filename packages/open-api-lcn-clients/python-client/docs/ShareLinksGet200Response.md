# ShareLinksGet200Response

## Properties

| Name             | Type                                                                                  | Description | Notes |
| ---------------- | ------------------------------------------------------------------------------------- | ----------- | ----- |
| **status**       | **str**                                                                               |             |
| **share**        | [**ShareLinksList200ResponseRecordsInner**](ShareLinksList200ResponseRecordsInner.md) |             |
| **id**           | **str**                                                                               |             |
| **operation_id** | **UUID**                                                                              |             |

## Example

```python
from openapi_client.models.share_links_get200_response import ShareLinksGet200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksGet200Response from a JSON string
share_links_get200_response_instance = ShareLinksGet200Response.from_json(json)
# print the JSON string representation of the object
print(ShareLinksGet200Response.to_json())

# convert the object into a dict
share_links_get200_response_dict = share_links_get200_response_instance.to_dict()
# create an instance of ShareLinksGet200Response from a dict
share_links_get200_response_from_dict = ShareLinksGet200Response.from_dict(share_links_get200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
