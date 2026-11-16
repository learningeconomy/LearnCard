# AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges

## Properties

| Name                      | Type          | Description | Notes      |
| ------------------------- | ------------- | ----------- | ---------- |
| **slug**                  | **str**       |             | [optional] |
| **display_name**          | **str**       |             | [optional] |
| **tagline**               | **str**       |             | [optional] |
| **full_description**      | **str**       |             | [optional] |
| **icon_url**              | **str**       |             | [optional] |
| **launch_type**           | **str**       |             | [optional] |
| **launch_config_json**    | **str**       |             | [optional] |
| **category**              | **str**       |             | [optional] |
| **promo_video_url**       | **str**       |             | [optional] |
| **ios_app_store_id**      | **str**       |             | [optional] |
| **android_app_store_id**  | **str**       |             | [optional] |
| **privacy_policy_url**    | **str**       |             | [optional] |
| **terms_url**             | **str**       |             | [optional] |
| **highlights**            | **List[str]** |             | [optional] |
| **screenshots**           | **List[str]** |             | [optional] |
| **hero_background_color** | **str**       |             | [optional] |
| **min_age**               | **int**       |             | [optional] |
| **age_rating**            | **str**       |             | [optional] |
| **contact_email**         | **str**       |             | [optional] |

## Example

```python
from openapi_client.models.app_store_get_listings_for_integration200_response_records_inner_pending_update_changes import AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges from a JSON string
app_store_get_listings_for_integration200_response_records_inner_pending_update_changes_instance = AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges.from_json(json)
# print the JSON string representation of the object
print(AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges.to_json())

# convert the object into a dict
app_store_get_listings_for_integration200_response_records_inner_pending_update_changes_dict = app_store_get_listings_for_integration200_response_records_inner_pending_update_changes_instance.to_dict()
# create an instance of AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges from a dict
app_store_get_listings_for_integration200_response_records_inner_pending_update_changes_from_dict = AppStoreGetListingsForIntegration200ResponseRecordsInnerPendingUpdateChanges.from_dict(app_store_get_listings_for_integration200_response_records_inner_pending_update_changes_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
