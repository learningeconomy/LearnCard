# AppStoreGetListing200ResponsePendingUpdate

## Properties

| Name                 | Type                                                                                                          | Description | Notes      |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **status**           | **str**                                                                                                       |             |
| **submitted_at**     | **str**                                                                                                       |             | [optional] |
| **changes**          | [**AppStoreGetListing200ResponsePendingUpdateChanges**](AppStoreGetListing200ResponsePendingUpdateChanges.md) |             |
| **manifest_version** | **int**                                                                                                       |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_listing200_response_pending_update import AppStoreGetListing200ResponsePendingUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListing200ResponsePendingUpdate from a JSON string
app_store_get_listing200_response_pending_update_instance = AppStoreGetListing200ResponsePendingUpdate.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListing200ResponsePendingUpdate.to_json())

# convert the object into a dict
app_store_get_listing200_response_pending_update_dict = app_store_get_listing200_response_pending_update_instance.to_dict()
# create an instance of AppStoreGetListing200ResponsePendingUpdate from a dict
app_store_get_listing200_response_pending_update_from_dict = AppStoreGetListing200ResponsePendingUpdate.from_dict(app_store_get_listing200_response_pending_update_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
