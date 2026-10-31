# AppStoreSubmitAppManifest200Response

## Properties

| Name              | Type                                                                                        | Description | Notes |
| ----------------- | ------------------------------------------------------------------------------------------- | ----------- | ----- |
| **version**       | **int**                                                                                     |             |
| **manifest_hash** | **str**                                                                                     |             |
| **diff**          | [**AppStoreSubmitAppManifest200ResponseDiff**](AppStoreSubmitAppManifest200ResponseDiff.md) |             |
| **noop**          | **bool**                                                                                    |             |

## Example

```python
from openapi_client.models.app_store_submit_app_manifest200_response import AppStoreSubmitAppManifest200Response

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreSubmitAppManifest200Response from a JSON string
app_store_submit_app_manifest200_response_instance = AppStoreSubmitAppManifest200Response.from_json(json)
# print the JSON string representation of the object
print(AppStoreSubmitAppManifest200Response.to_json())

# convert the object into a dict
app_store_submit_app_manifest200_response_dict = app_store_submit_app_manifest200_response_instance.to_dict()
# create an instance of AppStoreSubmitAppManifest200Response from a dict
app_store_submit_app_manifest200_response_from_dict = AppStoreSubmitAppManifest200Response.from_dict(app_store_submit_app_manifest200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
