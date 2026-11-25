# AppStoreSubmitAppManifestRequestManifestConsentRequestsInner

## Properties

| Name             | Type                                                                                                                                            | Description | Notes      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **scopes**       | [**AppStoreSubmitAppManifestRequestManifestConsentRequestsInnerScopes**](AppStoreSubmitAppManifestRequestManifestConsentRequestsInnerScopes.md) |             |
| **reason**       | **str**                                                                                                                                         |             | [optional] |
| **last_used_at** | **str**                                                                                                                                         |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request_manifest_consent_requests_inner import AppStoreSubmitAppManifestRequestManifestConsentRequestsInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequestManifestConsentRequestsInner from a JSON string
app_store_submit_app_manifest_request_manifest_consent_requests_inner_instance = AppStoreSubmitAppManifestRequestManifestConsentRequestsInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequestManifestConsentRequestsInner.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_manifest_consent_requests_inner_dict = app_store_submit_app_manifest_request_manifest_consent_requests_inner_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequestManifestConsentRequestsInner from a dict
app_store_submit_app_manifest_request_manifest_consent_requests_inner_from_dict = AppStoreSubmitAppManifestRequestManifestConsentRequestsInner.from_dict(app_store_submit_app_manifest_request_manifest_consent_requests_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
