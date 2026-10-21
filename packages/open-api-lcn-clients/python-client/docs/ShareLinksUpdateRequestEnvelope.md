# ShareLinksUpdateRequestEnvelope

## Properties

| Name    | Type      | Description | Notes |
| ------- | --------- | ----------- | ----- |
| **v**   | **float** |             |
| **alg** | **str**   |             |
| **iv**  | **str**   |             |
| **ct**  | **str**   |             |

## Example

```python
from openapi_client.models.share_links_update_request_envelope import ShareLinksUpdateRequestEnvelope

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksUpdateRequestEnvelope from a JSON string
share_links_update_request_envelope_instance = ShareLinksUpdateRequestEnvelope.from_json(json)
# print the JSON string representation of the object
print(ShareLinksUpdateRequestEnvelope.to_json())

# convert the object into a dict
share_links_update_request_envelope_dict = share_links_update_request_envelope_instance.to_dict()
# create an instance of ShareLinksUpdateRequestEnvelope from a dict
share_links_update_request_envelope_from_dict = ShareLinksUpdateRequestEnvelope.from_dict(share_links_update_request_envelope_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
