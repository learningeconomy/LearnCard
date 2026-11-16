# AppStoreApplyManifestVersion200ResponseReconciled

## Properties

| Name                          | Type     | Description | Notes |
| ----------------------------- | -------- | ----------- | ----- |
| **templates_upserted**        | **int**  |             |
| **templates_skipped**         | **int**  |             |
| **contracts_upserted**        | **int**  |             |
| **contracts_skipped**         | **int**  |             |
| **signing_authority_ensured** | **bool** |             |

## Example

```python
from openapi_client.models.app_store_apply_manifest_version200_response_reconciled import AppStoreApplyManifestVersion200ResponseReconciled

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreApplyManifestVersion200ResponseReconciled from a JSON string
app_store_apply_manifest_version200_response_reconciled_instance = AppStoreApplyManifestVersion200ResponseReconciled.from_json(json)
# print the JSON string representation of the object
print(AppStoreApplyManifestVersion200ResponseReconciled.to_json())

# convert the object into a dict
app_store_apply_manifest_version200_response_reconciled_dict = app_store_apply_manifest_version200_response_reconciled_instance.to_dict()
# create an instance of AppStoreApplyManifestVersion200ResponseReconciled from a dict
app_store_apply_manifest_version200_response_reconciled_from_dict = AppStoreApplyManifestVersion200ResponseReconciled.from_dict(app_store_apply_manifest_version200_response_reconciled_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
