# AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate

## Properties

| Name                 | Type                                                                                                                                                                                              | Description | Notes      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **raw_credential**   | **object**                                                                                                                                                                                        |             |
| **category**         | **str**                                                                                                                                                                                           |             | [optional] |
| **wallet_skills**    | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner.md)       |             | [optional] |
| **name**             | **str**                                                                                                                                                                                           |             |
| **description**      | **str**                                                                                                                                                                                           |             | [optional] |
| **image**            | **str**                                                                                                                                                                                           |             | [optional] |
| **issuer_name**      | **str**                                                                                                                                                                                           |             | [optional] |
| **achievement_type** | **str**                                                                                                                                                                                           |             | [optional] |
| **criteria**         | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Criteria**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Criteria.md)                     |             | [optional] |
| **alignments**       | [**List[AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1AlignmentsInner]**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1AlignmentsInner.md) |             | [optional] |
| **tags**             | **List[str]**                                                                                                                                                                                     |             | [optional] |
| **activity**         | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Activity**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Activity.md)                     |             | [optional] |
| **credits**          | [**AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Credits**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1Credits.md)                       |             | [optional] |
| **valid_until**      | **str**                                                                                                                                                                                           |             | [optional] |
| **evidence**         | [**List[AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1EvidenceInner]**](AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplateAnyOf1EvidenceInner.md)     |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response_manifest_templates_inner_template import AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate from a JSON string
app_store_get_manifest_version200_response_manifest_templates_inner_template_instance = AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_manifest_templates_inner_template_dict = app_store_get_manifest_version200_response_manifest_templates_inner_template_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate from a dict
app_store_get_manifest_version200_response_manifest_templates_inner_template_from_dict = AppStoreGetManifestVersion200ResponseManifestTemplatesInnerTemplate.from_dict(app_store_get_manifest_version200_response_manifest_templates_inner_template_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
