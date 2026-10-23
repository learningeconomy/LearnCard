# AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf

## Properties

| Name               | Type                                                                                                                                                                                        | Description | Notes      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **raw_credential** | **Dict[str, Optional[object]]**                                                                                                                                                             |             |
| **category**       | **str**                                                                                                                                                                                     |             | [optional] |
| **wallet_skills**  | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner.md) |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of import AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf from a JSON string
app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of_instance = AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of_dict = app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf from a dict
app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of_from_dict = AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf.from_dict(app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
