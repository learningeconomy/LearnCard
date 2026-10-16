# AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate

## Properties

| Name                 | Type                                                                                                                                                                                        | Description | Notes      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **raw_credential**   | **object**                                                                                                                                                                                  |             |
| **category**         | **str**                                                                                                                                                                                     |             | [optional] |
| **wallet_skills**    | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner.md) |             | [optional] |
| **name**             | **str**                                                                                                                                                                                     |             |
| **description**      | **str**                                                                                                                                                                                     |             | [optional] |
| **image**            | **str**                                                                                                                                                                                     |             | [optional] |
| **issuer_name**      | **str**                                                                                                                                                                                     |             | [optional] |
| **achievement_type** | **str**                                                                                                                                                                                     |             | [optional] |
| **criteria**         | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Criteria**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Criteria.md)                         |             | [optional] |
| **alignments**       | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1AlignmentsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1AlignmentsInner.md)     |             | [optional] |
| **tags**             | **List[str]**                                                                                                                                                                               |             | [optional] |
| **activity**         | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Activity**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Activity.md)                         |             | [optional] |
| **credits**          | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Credits**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Credits.md)                           |             | [optional] |
| **valid_until**      | **str**                                                                                                                                                                                     |             | [optional] |
| **evidence**         | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1EvidenceInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1EvidenceInner.md)         |             | [optional] |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request_manifest_templates_inner_template import AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate from a JSON string
app_store_submit_app_manifest_request_manifest_templates_inner_template_instance = AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_manifest_templates_inner_template_dict = app_store_submit_app_manifest_request_manifest_templates_inner_template_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate from a dict
app_store_submit_app_manifest_request_manifest_templates_inner_template_from_dict = AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplate.from_dict(app_store_submit_app_manifest_request_manifest_templates_inner_template_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
