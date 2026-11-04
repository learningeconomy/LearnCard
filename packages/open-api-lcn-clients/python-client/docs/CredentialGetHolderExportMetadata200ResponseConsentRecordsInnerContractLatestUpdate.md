# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate

## Properties

| Name                   | Type                                                                                                                                                                                            | Description | Notes      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **from_version**       | **int**                                                                                                                                                                                         |             |
| **to_version**         | **int**                                                                                                                                                                                         |             |
| **kind**               | **str**                                                                                                                                                                                         |             |
| **reason**             | **str**                                                                                                                                                                                         |             | [optional] |
| **diff**               | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdateDiff**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdateDiff.md)       |             |
| **reconsent_deadline** | **str**                                                                                                                                                                                         |             | [optional] |
| **created_at**         | **str**                                                                                                                                                                                         |             |
| **preview**            | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdatePreview**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdatePreview.md) |             |

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_contract_latest_update import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_contract_latest_update_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_latest_update_dict = credential_get_holder_export_metadata200_response_consent_records_inner_contract_latest_update_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_latest_update_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdate.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_contract_latest_update_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
