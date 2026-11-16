# AppStoreSubmitAppManifestRequestManifestTemplatesInner

## Properties

| Name             | Type                                                                                                                                    | Description | Notes |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **alias**        | **str**                                                                                                                                 |             |
| **template**     | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate.md) |             |
| **version**      | **int**                                                                                                                                 |             |
| **last_used_at** | **str**                                                                                                                                 |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request_manifest_templates_inner import AppStoreSubmitAppManifestRequestManifestTemplatesInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInner from a JSON string
app_store_submit_app_manifest_request_manifest_templates_inner_instance = AppStoreSubmitAppManifestRequestManifestTemplatesInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequestManifestTemplatesInner.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_manifest_templates_inner_dict = app_store_submit_app_manifest_request_manifest_templates_inner_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInner from a dict
app_store_submit_app_manifest_request_manifest_templates_inner_from_dict = AppStoreSubmitAppManifestRequestManifestTemplatesInner.from_dict(app_store_submit_app_manifest_request_manifest_templates_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
