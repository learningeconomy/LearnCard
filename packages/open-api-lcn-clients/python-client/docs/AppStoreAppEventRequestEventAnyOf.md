# AppStoreAppEventRequestEventAnyOf

## Properties

| Name                        | Type                                                                                                                                    | Description | Notes      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **type**                    | **str**                                                                                                                                 |             |
| **template_alias**          | **str**                                                                                                                                 |             |
| **template_data**           | **Dict[str, object]**                                                                                                                   |             | [optional] |
| **prevent_duplicate_claim** | **bool**                                                                                                                                |             | [optional] |
| **alias**                   | **str**                                                                                                                                 |             |
| **template**                | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate.md) |             |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of import AppStoreAppEventRequestEventAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOf from a JSON string
app_store_app_event_request_event_any_of_instance = AppStoreAppEventRequestEventAnyOf.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOf.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of_dict = app_store_app_event_request_event_any_of_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOf from a dict
app_store_app_event_request_event_any_of_from_dict = AppStoreAppEventRequestEventAnyOf.from_dict(app_store_app_event_request_event_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
