# BoostSendRequestDisplay

Public display metadata for managed and signed-only sends. Nothing is inferred from credential content; omitted names use generic copy. The exception is category: when display.category is omitted for an inline template, the template's category is copied, since consent-flow write authorization is keyed on it.

## Properties

| Name         | Type    | Description | Notes      |
| ------------ | ------- | ----------- | ---------- |
| **name**     | **str** |             | [optional] |
| **category** | **str** |             | [optional] |
| **image**    | **str** |             | [optional] |

## Example

```python
from openapi_client.models.boost_send_request_display import BoostSendRequestDisplay

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestDisplay from a JSON string
boost_send_request_display_instance = BoostSendRequestDisplay.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestDisplay.to_json())

# convert the object into a dict
boost_send_request_display_dict = boost_send_request_display_instance.to_dict()
# create an instance of BoostSendRequestDisplay from a dict
boost_send_request_display_from_dict = BoostSendRequestDisplay.from_dict(boost_send_request_display_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
