# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate

## Properties

| Name                   | Type                                                                                                                                                                                            | Description | Notes      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **from_version**       | **int**                                                                                                                                                                                         |             |
| **to_version**         | **int**                                                                                                                                                                                         |             |
| **kind**               | **str**                                                                                                                                                                                         |             |
| **reason**             | **str**                                                                                                                                                                                         |             | [optional] |
| **diff**               | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdateDiff**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdateDiff.md)               |             |
| **reconsent_deadline** | **str**                                                                                                                                                                                         |             | [optional] |
| **created_at**         | **str**                                                                                                                                                                                         |             |
| **preview**            | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdatePreview**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdatePreview.md) |             |

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_cumulative_update import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_cumulative_update_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_cumulative_update_dict = credential_get_holder_export_metadata200_response_consent_records_inner_cumulative_update_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_cumulative_update_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerCumulativeUpdate.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_cumulative_update_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
