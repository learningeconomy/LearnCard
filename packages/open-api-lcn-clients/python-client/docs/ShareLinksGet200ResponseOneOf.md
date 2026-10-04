# ShareLinksGet200ResponseOneOf

## Properties

| Name       | Type                                                                                  | Description | Notes |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | ----- |
| **status** | **str**                                                                               |             |
| **share**  | [**ShareLinksList200ResponseRecordsInner**](ShareLinksList200ResponseRecordsInner.md) |             |

## Example

```python
from openapi_client.models.share_links_get200_response_one_of import ShareLinksGet200ResponseOneOf

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksGet200ResponseOneOf from a JSON string
share_links_get200_response_one_of_instance = ShareLinksGet200ResponseOneOf.from_json(json)
# print the JSON string representation of the object
print(ShareLinksGet200ResponseOneOf.to_json())

# convert the object into a dict
share_links_get200_response_one_of_dict = share_links_get200_response_one_of_instance.to_dict()
# create an instance of ShareLinksGet200ResponseOneOf from a dict
share_links_get200_response_one_of_from_dict = ShareLinksGet200ResponseOneOf.from_dict(share_links_get200_response_one_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
