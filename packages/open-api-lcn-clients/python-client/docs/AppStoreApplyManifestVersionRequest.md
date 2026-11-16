# AppStoreApplyManifestVersionRequest

## Properties

| Name           | Type    | Description | Notes      |
| -------------- | ------- | ----------- | ---------- |
| **listing_id** | **str** |             | [optional] |

## Example

```python
from openapi_client.models.app_store_apply_manifest_version_request import AppStoreApplyManifestVersionRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreApplyManifestVersionRequest from a JSON string
app_store_apply_manifest_version_request_instance = AppStoreApplyManifestVersionRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreApplyManifestVersionRequest.to_json())

# convert the object into a dict
app_store_apply_manifest_version_request_dict = app_store_apply_manifest_version_request_instance.to_dict()
# create an instance of AppStoreApplyManifestVersionRequest from a dict
app_store_apply_manifest_version_request_from_dict = AppStoreApplyManifestVersionRequest.from_dict(app_store_apply_manifest_version_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
