# AppStoreGetManifestDiff200Response

## Properties

| Name                | Type                                                                                                                  | Description | Notes |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **permissions**     | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **templates**       | [**AppStoreGetManifestDiff200ResponseTemplates**](AppStoreGetManifestDiff200ResponseTemplates.md)                     |             |
| **consent_scopes**  | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **feature_paths**   | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **counter_keys**    | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **requires_review** | **bool**                                                                                                              |             |

## Example

```python
from openapi_client.models.app_store_get_manifest_diff200_response import AppStoreGetManifestDiff200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestDiff200Response from a JSON string
app_store_get_manifest_diff200_response_instance = AppStoreGetManifestDiff200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestDiff200Response.to_json())

# convert the object into a dict
app_store_get_manifest_diff200_response_dict = app_store_get_manifest_diff200_response_instance.to_dict()
# create an instance of AppStoreGetManifestDiff200Response from a dict
app_store_get_manifest_diff200_response_from_dict = AppStoreGetManifestDiff200Response.from_dict(app_store_get_manifest_diff200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
