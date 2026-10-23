# AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner

## Properties

| Name             | Type                                                                                                                                                      | Description | Notes      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **scopes**       | [**AppStoreGetManifestVersion200ResponseManifestConsentRequestsInnerScopes**](AppStoreGetManifestVersion200ResponseManifestConsentRequestsInnerScopes.md) |             |
| **reason**       | **str**                                                                                                                                                   |             | [optional] |
| **last_used_at** | **str**                                                                                                                                                   |             |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response_manifest_consent_requests_inner import AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner from a JSON string
app_store_get_manifest_version200_response_manifest_consent_requests_inner_instance = AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_manifest_consent_requests_inner_dict = app_store_get_manifest_version200_response_manifest_consent_requests_inner_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner from a dict
app_store_get_manifest_version200_response_manifest_consent_requests_inner_from_dict = AppStoreGetManifestVersion200ResponseManifestConsentRequestsInner.from_dict(app_store_get_manifest_version200_response_manifest_consent_requests_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
