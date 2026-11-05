# AppStoreGetManifestVersions200Response

## Properties

| Name         | Type                                                                                                                  | Description | Notes      |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **has_more** | **bool**                                                                                                              |             |
| **cursor**   | **str**                                                                                                               |             | [optional] |
| **records**  | [**List[AppStoreGetManifestVersions200ResponseRecordsInner]**](AppStoreGetManifestVersions200ResponseRecordsInner.md) |             |

## Example

```python
from openapi_client.models.app_store_get_manifest_versions200_response import AppStoreGetManifestVersions200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersions200Response from a JSON string
app_store_get_manifest_versions200_response_instance = AppStoreGetManifestVersions200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersions200Response.to_json())

# convert the object into a dict
app_store_get_manifest_versions200_response_dict = app_store_get_manifest_versions200_response_instance.to_dict()
# create an instance of AppStoreGetManifestVersions200Response from a dict
app_store_get_manifest_versions200_response_from_dict = AppStoreGetManifestVersions200Response.from_dict(app_store_get_manifest_versions200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
