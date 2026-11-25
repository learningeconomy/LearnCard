# AppStoreAppEventRequestEventAnyOf3

## Properties

| Name               | Type      | Description | Notes      |
| ------------------ | --------- | ----------- | ---------- |
| **type**           | **str**   |             |
| **template_alias** | **str**   |             | [optional] |
| **boost_uri**      | **str**   |             | [optional] |
| **limit**          | **float** |             | [optional] |
| **cursor**         | **str**   |             | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of3 import AppStoreAppEventRequestEventAnyOf3

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOf3 from a JSON string
app_store_app_event_request_event_any_of3_instance = AppStoreAppEventRequestEventAnyOf3.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOf3.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of3_dict = app_store_app_event_request_event_any_of3_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOf3 from a dict
app_store_app_event_request_event_any_of3_from_dict = AppStoreAppEventRequestEventAnyOf3.from_dict(app_store_app_event_request_event_any_of3_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
