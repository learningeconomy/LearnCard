# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsReadCredentials**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsReadCredentials.md) |  | 
**personal** | **Dict[str, Optional[str]]** |  | 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_terms_read import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_terms_read_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_terms_read_dict = credential_get_holder_export_metadata200_response_consent_records_inner_terms_read_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_terms_read_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_terms_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


