# AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf

## Properties

| Name               | Type                                                                                                                                                                                      | Description | Notes      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **raw_credential** | **Dict[str, Optional[object]]**                                                                                                                                                           |             |
| **category**       | **str**                                                                                                                                                                                   |             | [optional] |
| **wallet_skills**  | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOfWalletSkillsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOfWalletSkillsInner.md) |             | [optional] |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of import AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf from a JSON string
app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of_instance = AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of_dict = app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf from a dict
app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of_from_dict = AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf.from_dict(app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
