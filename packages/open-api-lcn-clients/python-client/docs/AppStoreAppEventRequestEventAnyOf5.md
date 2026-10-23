# AppStoreAppEventRequestEventAnyOf5

## Properties

| Name              | Type                                                                                                  | Description | Notes      |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **type**          | **str**                                                                                               |             |
| **session_title** | **str**                                                                                               |             |
| **summary_data**  | [**AppStoreAppEventRequestEventAnyOf5SummaryData**](AppStoreAppEventRequestEventAnyOf5SummaryData.md) |             |
| **metadata**      | **Dict[str, Optional[object]]**                                                                       |             | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of5 import AppStoreAppEventRequestEventAnyOf5

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOf5 from a JSON string
app_store_app_event_request_event_any_of5_instance = AppStoreAppEventRequestEventAnyOf5.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOf5.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of5_dict = app_store_app_event_request_event_any_of5_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOf5 from a dict
app_store_app_event_request_event_any_of5_from_dict = AppStoreAppEventRequestEventAnyOf5.from_dict(app_store_app_event_request_event_any_of5_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
