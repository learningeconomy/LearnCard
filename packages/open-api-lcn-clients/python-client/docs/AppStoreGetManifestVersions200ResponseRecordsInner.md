# AppStoreGetManifestVersions200ResponseRecordsInner

## Properties

| Name              | Type    | Description | Notes      |
| ----------------- | ------- | ----------- | ---------- |
| **id**            | **str** |             |
| **version**       | **int** |             |
| **manifest_hash** | **str** |             |
| **status**        | **str** |             |
| **created_at**    | **str** |             |
| **activated_at**  | **str** |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_manifest_versions200_response_records_inner import AppStoreGetManifestVersions200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersions200ResponseRecordsInner from a JSON string
app_store_get_manifest_versions200_response_records_inner_instance = AppStoreGetManifestVersions200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersions200ResponseRecordsInner.to_json())

# convert the object into a dict
app_store_get_manifest_versions200_response_records_inner_dict = app_store_get_manifest_versions200_response_records_inner_instance.to_dict()
# create an instance of AppStoreGetManifestVersions200ResponseRecordsInner from a dict
app_store_get_manifest_versions200_response_records_inner_from_dict = AppStoreGetManifestVersions200ResponseRecordsInner.from_dict(app_store_get_manifest_versions200_response_records_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
