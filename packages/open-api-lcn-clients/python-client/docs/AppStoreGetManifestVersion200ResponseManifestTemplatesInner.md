# AppStoreGetManifestVersion200ResponseManifestTemplatesInner

## Properties

| Name             | Type                                                                                                                                              | Description | Notes |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **alias**        | **str**                                                                                                                                           |             |
| **template**     | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate.md) |             |
| **version**      | **int**                                                                                                                                           |             |
| **last_used_at** | **str**                                                                                                                                           |             |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response_manifest_templates_inner import AppStoreGetManifestVersion200ResponseManifestTemplatesInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInner from a JSON string
app_store_get_manifest_version200_response_manifest_templates_inner_instance = AppStoreGetManifestVersion200ResponseManifestTemplatesInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200ResponseManifestTemplatesInner.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_manifest_templates_inner_dict = app_store_get_manifest_version200_response_manifest_templates_inner_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInner from a dict
app_store_get_manifest_version200_response_manifest_templates_inner_from_dict = AppStoreGetManifestVersion200ResponseManifestTemplatesInner.from_dict(app_store_get_manifest_version200_response_manifest_templates_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
