# AppStoreAppEventRequestEventAnyOf6

## Properties

| Name            | Type    | Description | Notes      |
| --------------- | ------- | ----------- | ---------- |
| **type**        | **str** |             |
| **title**       | **str** |             | [optional] |
| **body**        | **str** |             | [optional] |
| **action_path** | **str** |             | [optional] |
| **category**    | **str** |             | [optional] |
| **priority**    | **str** |             | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of6 import AppStoreAppEventRequestEventAnyOf6

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOf6 from a JSON string
app_store_app_event_request_event_any_of6_instance = AppStoreAppEventRequestEventAnyOf6.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOf6.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of6_dict = app_store_app_event_request_event_any_of6_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOf6 from a dict
app_store_app_event_request_event_any_of6_from_dict = AppStoreAppEventRequestEventAnyOf6.from_dict(app_store_app_event_request_event_any_of6_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
