# AppStoreAppEventRequestEventAnyOfAnyOf1

## Properties

| Name                        | Type                                                                                                                                    | Description | Notes      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **type**                    | **str**                                                                                                                                 |             |
| **alias**                   | **str**                                                                                                                                 |             |
| **template**                | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate.md) |             |
| **template_data**           | **Dict[str, Optional[object]]**                                                                                                         |             | [optional] |
| **prevent_duplicate_claim** | **bool**                                                                                                                                |             | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of_any_of1 import AppStoreAppEventRequestEventAnyOfAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOfAnyOf1 from a JSON string
app_store_app_event_request_event_any_of_any_of1_instance = AppStoreAppEventRequestEventAnyOfAnyOf1.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOfAnyOf1.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of_any_of1_dict = app_store_app_event_request_event_any_of_any_of1_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOfAnyOf1 from a dict
app_store_app_event_request_event_any_of_any_of1_from_dict = AppStoreAppEventRequestEventAnyOfAnyOf1.from_dict(app_store_app_event_request_event_any_of_any_of1_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
