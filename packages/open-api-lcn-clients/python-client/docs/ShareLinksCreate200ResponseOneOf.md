# ShareLinksCreate200ResponseOneOf

## Properties

| Name       | Type                                                                                  | Description | Notes |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | ----- |
| **status** | **str**                                                                               |             |
| **share**  | [**ShareLinksCreate200ResponseOneOfShare**](ShareLinksCreate200ResponseOneOfShare.md) |             |

## Example

```python
from openapi_client.models.share_links_create200_response_one_of import ShareLinksCreate200ResponseOneOf

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksCreate200ResponseOneOf from a JSON string
share_links_create200_response_one_of_instance = ShareLinksCreate200ResponseOneOf.from_json(json)
# print the JSON string representation of the object
print(ShareLinksCreate200ResponseOneOf.to_json())

# convert the object into a dict
share_links_create200_response_one_of_dict = share_links_create200_response_one_of_instance.to_dict()
# create an instance of ShareLinksCreate200ResponseOneOf from a dict
share_links_create200_response_one_of_from_dict = ShareLinksCreate200ResponseOneOf.from_dict(share_links_create200_response_one_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
