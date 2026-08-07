# CredentialGetHolderExportMetadata200ResponseConsentRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**terms_uri** | **str** |  | 
**status** | **str** |  | 
**contract** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract.md) |  | 
**terms** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTerms.md) |  | 
**transactions** | [**List[CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner]**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner.md) |  | 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner import CredentialGetHolderExportMetadata200ResponseConsentRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInner from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInner.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInner.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_dict = credential_get_holder_export_metadata200_response_consent_records_inner_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInner from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInner.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


