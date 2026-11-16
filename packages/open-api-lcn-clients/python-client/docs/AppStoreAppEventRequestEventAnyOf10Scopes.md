# AppStoreAppEventRequestEventAnyOf10Scopes

## Properties

| Name       | Type                                                                                                    | Description | Notes      |
| ---------- | ------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **read**   | [**AppStoreAppEventRequestEventAnyOf10ScopesRead**](AppStoreAppEventRequestEventAnyOf10ScopesRead.md)   |             | [optional] |
| **write**  | [**AppStoreAppEventRequestEventAnyOf10ScopesWrite**](AppStoreAppEventRequestEventAnyOf10ScopesWrite.md) |             | [optional] |
| **reason** | **str**                                                                                                 |             | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of10_scopes import AppStoreAppEventRequestEventAnyOf10Scopes

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOf10Scopes from a JSON string
app_store_app_event_request_event_any_of10_scopes_instance = AppStoreAppEventRequestEventAnyOf10Scopes.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOf10Scopes.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of10_scopes_dict = app_store_app_event_request_event_any_of10_scopes_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOf10Scopes from a dict
app_store_app_event_request_event_any_of10_scopes_from_dict = AppStoreAppEventRequestEventAnyOf10Scopes.from_dict(app_store_app_event_request_event_any_of10_scopes_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
