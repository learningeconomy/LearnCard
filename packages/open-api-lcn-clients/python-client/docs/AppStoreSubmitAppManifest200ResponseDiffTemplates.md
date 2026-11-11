# AppStoreSubmitAppManifest200ResponseDiffTemplates

## Properties

| Name        | Type                                                                                                                                        | Description | Notes |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **added**   | [**List[AppStoreSubmitAppManifest200ResponseDiffTemplatesAddedInner]**](AppStoreSubmitAppManifest200ResponseDiffTemplatesAddedInner.md)     |             |
| **removed** | [**List[AppStoreSubmitAppManifest200ResponseDiffTemplatesRemovedInner]**](AppStoreSubmitAppManifest200ResponseDiffTemplatesRemovedInner.md) |             |
| **changed** | [**List[AppStoreSubmitAppManifest200ResponseDiffTemplatesChangedInner]**](AppStoreSubmitAppManifest200ResponseDiffTemplatesChangedInner.md) |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest200_response_diff_templates import AppStoreSubmitAppManifest200ResponseDiffTemplates

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifest200ResponseDiffTemplates from a JSON string
app_store_submit_app_manifest200_response_diff_templates_instance = AppStoreSubmitAppManifest200ResponseDiffTemplates.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifest200ResponseDiffTemplates.to_json())

# convert the object into a dict
app_store_submit_app_manifest200_response_diff_templates_dict = app_store_submit_app_manifest200_response_diff_templates_instance.to_dict()
# create an instance of AppStoreSubmitAppManifest200ResponseDiffTemplates from a dict
app_store_submit_app_manifest200_response_diff_templates_from_dict = AppStoreSubmitAppManifest200ResponseDiffTemplates.from_dict(app_store_submit_app_manifest200_response_diff_templates_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
