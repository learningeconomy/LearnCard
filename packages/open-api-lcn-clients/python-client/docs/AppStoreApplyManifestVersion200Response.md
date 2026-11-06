# AppStoreApplyManifestVersion200Response

## Properties

| Name               | Type                                                                                                          | Description | Notes      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **applied**        | **bool**                                                                                                      |             |
| **pending_review** | **bool**                                                                                                      |             | [optional] |
| **version**        | **int**                                                                                                       |             |
| **reconciled**     | [**AppStoreApplyManifestVersion200ResponseReconciled**](AppStoreApplyManifestVersion200ResponseReconciled.md) |             |

## Example

```python
from openapi_client.models.app_store_apply_manifest_version200_response import AppStoreApplyManifestVersion200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreApplyManifestVersion200Response from a JSON string
app_store_apply_manifest_version200_response_instance = AppStoreApplyManifestVersion200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreApplyManifestVersion200Response.to_json())

# convert the object into a dict
app_store_apply_manifest_version200_response_dict = app_store_apply_manifest_version200_response_instance.to_dict()
# create an instance of AppStoreApplyManifestVersion200Response from a dict
app_store_apply_manifest_version200_response_from_dict = AppStoreApplyManifestVersion200Response.from_dict(app_store_apply_manifest_version200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
