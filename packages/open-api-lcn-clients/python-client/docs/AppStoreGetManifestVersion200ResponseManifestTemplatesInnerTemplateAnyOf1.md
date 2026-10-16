# AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1

## Properties

| Name                 | Type                                                                                                                                                                                              | Description | Notes      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **raw_credential**   | **object**                                                                                                                                                                                        |             | [optional] |
| **name**             | **str**                                                                                                                                                                                           |             |
| **description**      | **str**                                                                                                                                                                                           |             | [optional] |
| **image**            | **str**                                                                                                                                                                                           |             | [optional] |
| **issuer_name**      | **str**                                                                                                                                                                                           |             | [optional] |
| **achievement_type** | **str**                                                                                                                                                                                           |             | [optional] |
| **category**         | **str**                                                                                                                                                                                           |             | [optional] |
| **criteria**         | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Criteria**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Criteria.md)                     |             | [optional] |
| **alignments**       | [**List[AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1AlignmentsInner]**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1AlignmentsInner.md) |             | [optional] |
| **tags**             | **List[str]**                                                                                                                                                                                     |             | [optional] |
| **activity**         | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Activity**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Activity.md)                     |             | [optional] |
| **credits**          | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Credits**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Credits.md)                       |             | [optional] |
| **valid_until**      | **str**                                                                                                                                                                                           |             | [optional] |
| **evidence**         | [**List[AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1EvidenceInner]**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1EvidenceInner.md)     |             | [optional] |
| **wallet_skills**    | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner.md)       |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of1 import AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1 from a JSON string
app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of1_instance = AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of1_dict = app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of1_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1 from a dict
app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of1_from_dict = AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1.from_dict(app_store_get_manifest_version200_response_manifest_templates_inner_template_any_of1_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
