# AppStoreGetManifestVersion200Response

## Properties

| Name              | Type                                                                                                  | Description | Notes      |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **id**            | **str**                                                                                               |             |
| **version**       | **int**                                                                                               |             |
| **manifest_hash** | **str**                                                                                               |             |
| **manifest**      | [**AppStoreGetManifestVersion200ResponseManifest**](AppStoreGetManifestVersion200ResponseManifest.md) |             |
| **status**        | **str**                                                                                               |             |
| **created_at**    | **str**                                                                                               |             |
| **activated_at**  | **str**                                                                                               |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_manifest_version200_response import AppStoreGetManifestVersion200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetManifestVersion200Response from a JSON string
app_store_get_manifest_version200_response_instance = AppStoreGetManifestVersion200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetManifestVersion200Response.to_json())

# convert the object into a dict
app_store_get_manifest_version200_response_dict = app_store_get_manifest_version200_response_instance.to_dict()
# create an instance of AppStoreGetManifestVersion200Response from a dict
app_store_get_manifest_version200_response_from_dict = AppStoreGetManifestVersion200Response.from_dict(app_store_get_manifest_version200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
