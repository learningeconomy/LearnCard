# AppStoreSubmitAppManifestRequest

## Properties

| Name         | Type                                                                                        | Description | Notes |
| ------------ | ------------------------------------------------------------------------------------------- | ----------- | ----- |
| **manifest** | [**AppStoreSubmitAppManifestRequestManifest**](AppStoreSubmitAppManifestRequestManifest.md) |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest_request import AppStoreSubmitAppManifestRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifestRequest from a JSON string
app_store_submit_app_manifest_request_instance = AppStoreSubmitAppManifestRequest.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifestRequest.to_json())

# convert the object into a dict
app_store_submit_app_manifest_request_dict = app_store_submit_app_manifest_request_instance.to_dict()
# create an instance of AppStoreSubmitAppManifestRequest from a dict
app_store_submit_app_manifest_request_from_dict = AppStoreSubmitAppManifestRequest.from_dict(app_store_submit_app_manifest_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
