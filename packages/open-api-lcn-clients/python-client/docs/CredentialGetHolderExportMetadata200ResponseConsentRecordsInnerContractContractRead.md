# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractReadCredentials**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractReadCredentials.md) |  | 
**personal** | [**Dict[str, CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractReadPersonalValue]**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractReadPersonalValue.md) |  | 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_contract_contract_read import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_contract_contract_read_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_contract_read_dict = credential_get_holder_export_metadata200_response_consent_records_inner_contract_contract_read_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_contract_read_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContractRead.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_contract_contract_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


