# AppStoreGetManifestDiff200ResponseTemplates

## Properties

| Name        | Type                                                                                                                                        | Description | Notes |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **added**   | [**List[AppStoreSubmitAppManifest200ResponseDiffTemplatesRemovedInner]**](AppStoreSubmitAppManifest200ResponseDiffTemplatesRemovedInner.md) |             |
| **removed** | [**List[AppStoreSubmitAppManifest200ResponseDiffTemplatesRemovedInner]**](AppStoreSubmitAppManifest200ResponseDiffTemplatesRemovedInner.md) |             |
| **changed** | [**List[AppStoreGetManifestDiff200ResponseTemplatesChangedInner]**](AppStoreGetManifestDiff200ResponseTemplatesChangedInner.md)             |             |

## Example

```python
from openapi_client.models.app_store_get_manifest_diff200_response_templates import AppStoreGetManifestDiff200ResponseTemplates

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestDiff200ResponseTemplates from a JSON string
app_store_get_manifest_diff200_response_templates_instance = AppStoreGetManifestDiff200ResponseTemplates.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestDiff200ResponseTemplates.to_json())

# convert the object into a dict
app_store_get_manifest_diff200_response_templates_dict = app_store_get_manifest_diff200_response_templates_instance.to_dict()
# create an instance of AppStoreGetManifestDiff200ResponseTemplates from a dict
app_store_get_manifest_diff200_response_templates_from_dict = AppStoreGetManifestDiff200ResponseTemplates.from_dict(app_store_get_manifest_diff200_response_templates_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
