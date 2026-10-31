# AppStoreAppEventRequestEventAnyOfAnyOf

## Properties

| Name                        | Type                            | Description | Notes      |
| --------------------------- | ------------------------------- | ----------- | ---------- |
| **type**                    | **str**                         |             |
| **template_alias**          | **str**                         |             |
| **template_data**           | **Dict[str, Optional[object]]** |             | [optional] |
| **prevent_duplicate_claim** | **bool**                        |             | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of_any_of import AppStoreAppEventRequestEventAnyOfAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOfAnyOf from a JSON string
app_store_app_event_request_event_any_of_any_of_instance = AppStoreAppEventRequestEventAnyOfAnyOf.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOfAnyOf.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of_any_of_dict = app_store_app_event_request_event_any_of_any_of_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOfAnyOf from a dict
app_store_app_event_request_event_any_of_any_of_from_dict = AppStoreAppEventRequestEventAnyOfAnyOf.from_dict(app_store_app_event_request_event_any_of_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
