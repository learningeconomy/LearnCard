# AppStoreSubmitAppManifest200ResponseDiff

## Properties

| Name                | Type                                                                                                                  | Description | Notes |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **permissions**     | [**AppStoreSubmitAppManifest200ResponseDiffPermissions**](AppStoreSubmitAppManifest200ResponseDiffPermissions.md)     |             |
| **templates**       | [**AppStoreSubmitAppManifest200ResponseDiffTemplates**](AppStoreSubmitAppManifest200ResponseDiffTemplates.md)         |             |
| **consent_scopes**  | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **feature_paths**   | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **counter_keys**    | [**AppStoreSubmitAppManifest200ResponseDiffConsentScopes**](AppStoreSubmitAppManifest200ResponseDiffConsentScopes.md) |             |
| **requires_review** | **bool**                                                                                                              |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest200_response_diff import AppStoreSubmitAppManifest200ResponseDiff

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifest200ResponseDiff from a JSON string
app_store_submit_app_manifest200_response_diff_instance = AppStoreSubmitAppManifest200ResponseDiff.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifest200ResponseDiff.to_json())

# convert the object into a dict
app_store_submit_app_manifest200_response_diff_dict = app_store_submit_app_manifest200_response_diff_instance.to_dict()
# create an instance of AppStoreSubmitAppManifest200ResponseDiff from a dict
app_store_submit_app_manifest200_response_diff_from_dict = AppStoreSubmitAppManifest200ResponseDiff.from_dict(app_store_submit_app_manifest200_response_diff_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
