# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsRead.md) |  | 
**write** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsWrite**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTermsWrite.md) |  | 
**denied_writers** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_terms import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_terms_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_terms_dict = credential_get_holder_export_metadata200_response_consent_records_inner_terms_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_terms_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_terms_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


