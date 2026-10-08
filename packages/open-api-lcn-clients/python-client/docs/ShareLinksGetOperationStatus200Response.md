# ShareLinksGetOperationStatus200Response

## Properties

| Name             | Type                                                                                  | Description | Notes |
| ---------------- | ------------------------------------------------------------------------------------- | ----------- | ----- |
| **status**       | **str**                                                                               |             |
| **share**        | [**ShareLinksList200ResponseRecordsInner**](ShareLinksList200ResponseRecordsInner.md) |             |
| **id**           | **str**                                                                               |             |
| **operation_id** | **UUID**                                                                              |             |

## Example

```python
from openapi_client.models.share_links_get_operation_status200_response import ShareLinksGetOperationStatus200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksGetOperationStatus200Response from a JSON string
share_links_get_operation_status200_response_instance = ShareLinksGetOperationStatus200Response.from_json(json)
# print the JSON string representation of the object
print(ShareLinksGetOperationStatus200Response.to_json())

# convert the object into a dict
share_links_get_operation_status200_response_dict = share_links_get_operation_status200_response_instance.to_dict()
# create an instance of ShareLinksGetOperationStatus200Response from a dict
share_links_get_operation_status200_response_from_dict = ShareLinksGetOperationStatus200Response.from_dict(share_links_get_operation_status200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
