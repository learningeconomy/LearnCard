# AppStoreSubmitAppManifestRequestManifest

## Properties

| Name                      | Type                                                                                                                                      | Description | Notes                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------- |
| **manifest_version**      | **float**                                                                                                                                 |             |
| **app_url**               | **str**                                                                                                                                   |             |
| **app_key**               | **str**                                                                                                                                   |             | [optional]                 |
| **suggested_name**        | **str**                                                                                                                                   |             | [optional]                 |
| **suggested_icon_url**    | **str**                                                                                                                                   |             | [optional]                 |
| **permissions**           | **List[str]**                                                                                                                             |             | [optional] [default to []] |
| **templates**             | [**List[AppStoreSubmitAppManifestRequestManifestTemplatesInner]**](AppStoreSubmitAppManifestRequestManifestTemplatesInner.md)             |             | [optional] [default to []] |
| **consent_requests**      | [**List[AppStoreSubmitAppManifestRequestManifestConsentRequestsInner]**](AppStoreSubmitAppManifestRequestManifestConsentRequestsInner.md) |             | [optional] [default to []] |
| **used_consent_contract** | **bool**                                                                                                                                  |             | [optional]                 |
| **features_launched**     | **List[str]**                                                                                                                             |             | [optional] [default to []] |
| **counter_keys**          | **List[str]**                                                                                                                             |             | [optional] [default to []] |
| **used_learner_context**  | **bool**                                                                                                                                  |             |
| **used_notifications**    | **bool**                                                                                                                                  |             |
| **first_captured_at**     | **str**                                                                                                                                   |             |
| **last_updated_at**       | **str**                                                                                                                                   |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request_manifest import AppStoreSubmitAppManifestRequestManifest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequestManifest from a JSON string
app_store_submit_app_manifest_request_manifest_instance = AppStoreSubmitAppManifestRequestManifest.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequestManifest.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_manifest_dict = app_store_submit_app_manifest_request_manifest_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequestManifest from a dict
app_store_submit_app_manifest_request_manifest_from_dict = AppStoreSubmitAppManifestRequestManifest.from_dict(app_store_submit_app_manifest_request_manifest_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
