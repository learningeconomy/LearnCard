# ShareLinksGetRecovery200Response

## Properties

| Name         | Type                                                                                                                            | Description | Notes |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **recovery** | [**InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential**](InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential.md) |             |

## Example

```python
from openapi_client.models.share_links_get_recovery200_response import ShareLinksGetRecovery200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksGetRecovery200Response from a JSON string
share_links_get_recovery200_response_instance = ShareLinksGetRecovery200Response.from_json(json)
# print the JSON string representation of the object
print(ShareLinksGetRecovery200Response.to_json())

# convert the object into a dict
share_links_get_recovery200_response_dict = share_links_get_recovery200_response_instance.to_dict()
# create an instance of ShareLinksGetRecovery200Response from a dict
share_links_get_recovery200_response_from_dict = ShareLinksGetRecovery200Response.from_dict(share_links_get_recovery200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
