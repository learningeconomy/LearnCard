# AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1

## Properties

| Name                 | Type                                                                                                                                                                                        | Description | Notes      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **raw_credential**   | **object**                                                                                                                                                                                  |             | [optional] |
| **name**             | **str**                                                                                                                                                                                     |             |
| **description**      | **str**                                                                                                                                                                                     |             | [optional] |
| **image**            | **str**                                                                                                                                                                                     |             | [optional] |
| **issuer_name**      | **str**                                                                                                                                                                                     |             | [optional] |
| **achievement_type** | **str**                                                                                                                                                                                     |             | [optional] |
| **category**         | **str**                                                                                                                                                                                     |             | [optional] |
| **criteria**         | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Criteria**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Criteria.md)                         |             | [optional] |
| **alignments**       | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1AlignmentsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1AlignmentsInner.md)     |             | [optional] |
| **tags**             | **List[str]**                                                                                                                                                                               |             | [optional] |
| **activity**         | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Activity**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Activity.md)                         |             | [optional] |
| **credits**          | [**AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Credits**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1Credits.md)                           |             | [optional] |
| **valid_until**      | **str**                                                                                                                                                                                     |             | [optional] |
| **evidence**         | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1EvidenceInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1EvidenceInner.md)         |             | [optional] |
| **wallet_skills**    | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1WalletSkillsInner.md) |             | [optional] |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of1 import AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1 from a JSON string
app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of1_instance = AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of1_dict = app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of1_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1 from a dict
app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of1_from_dict = AppStoreSubmitAppManifestRequestManifestTemplatesInnerTemplateAnyOf1.from_dict(app_store_submit_app_manifest_request_manifest_templates_inner_template_any_of1_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
