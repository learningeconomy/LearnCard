# AppStoreGetManifestVersion200ResponseManifest

## Properties

| Name                      | Type                                                                                                                                                | Description | Notes           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------- |
| **manifest_version**      | **float**                                                                                                                                           |             |
| **app_url**               | **str**                                                                                                                                             |             |
| **app_key**               | **str**                                                                                                                                             |             | [optional]      |
| **suggested_name**        | **str**                                                                                                                                             |             | [optional]      |
| **suggested_icon_url**    | **str**                                                                                                                                             |             | [optional]      |
| **permissions**           | **List[str]**                                                                                                                                       |             | [default to []] |
| **templates**             | [**List[AppStoreGetManifestVersion200ResponseManifestTemplatesInner]**](AppStoreGetManifestVersion200ResponseManifestTemplatesInner.md)             |             | [default to []] |
| **consent_requests**      | [**List[AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner]**](AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner.md) |             | [default to []] |
| **used_consent_contract** | **bool**                                                                                                                                            |             | [optional]      |
| **features_launched**     | **List[str]**                                                                                                                                       |             | [default to []] |
| **counter_keys**          | **List[str]**                                                                                                                                       |             | [default to []] |
| **used_learner_context**  | **bool**                                                                                                                                            |             |
| **used_notifications**    | **bool**                                                                                                                                            |             |
| **first_captured_at**     | **str**                                                                                                                                             |             |
| **last_updated_at**       | **str**                                                                                                                                             |             |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response_manifest import AppStoreGetManifestVersion200ResponseManifest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200ResponseManifest from a JSON string
app_store_get_manifest_version200_response_manifest_instance = AppStoreGetManifestVersion200ResponseManifest.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200ResponseManifest.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_manifest_dict = app_store_get_manifest_version200_response_manifest_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200ResponseManifest from a dict
app_store_get_manifest_version200_response_manifest_from_dict = AppStoreGetManifestVersion200ResponseManifest.from_dict(app_store_get_manifest_version200_response_manifest_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
