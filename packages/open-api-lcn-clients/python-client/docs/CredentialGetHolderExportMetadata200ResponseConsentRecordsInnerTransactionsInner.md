# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**expires_at** | **str** |  | [optional] 
**one_time** | **bool** |  | [optional] 
**terms** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInnerTerms**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInnerTerms.md) |  | [optional] 
**id** | **str** |  | 
**action** | **str** |  | 
**var_date** | **str** |  | 
**uris** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_transactions_inner import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_transactions_inner_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_transactions_inner_dict = credential_get_holder_export_metadata200_response_consent_records_inner_transactions_inner_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_transactions_inner_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerTransactionsInner.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_transactions_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


