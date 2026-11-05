# AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate

## Properties

| Name                 | Type                                                                                                                                                                | Description | Notes      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **status**           | **str**                                                                                                                                                             |             |
| **submitted_at**     | **str**                                                                                                                                                             |             | [optional] |
| **changes**          | [**AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges**](AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges.md) |             |
| **manifest_version** | **int**                                                                                                                                                             |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_listings_for_integration200_response_records_inner_pending_update import AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate from a JSON string
app_store_get_listings_for_integration200_response_records_inner_pending_update_instance = AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate.to_json())

# convert the object into a dict
app_store_get_listings_for_integration200_response_records_inner_pending_update_dict = app_store_get_listings_for_integration200_response_records_inner_pending_update_instance.to_dict()
# create an instance of AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate from a dict
app_store_get_listings_for_integration200_response_records_inner_pending_update_from_dict = AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdate.from_dict(app_store_get_listings_for_integration200_response_records_inner_pending_update_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
