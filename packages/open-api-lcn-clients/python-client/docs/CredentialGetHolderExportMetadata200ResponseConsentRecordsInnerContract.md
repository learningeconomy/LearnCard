# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract** | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContract**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractContract.md) |  | 
**owner** | [**BoostGetBoostRecipients200ResponseInnerToAnyOf3**](BoostGetBoostRecipients200ResponseInnerToAnyOf3.md) |  | 
**name** | **str** |  | 
**subtitle** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**reason_for_accessing** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**uri** | **str** |  | 
**needs_guardian_consent** | **bool** |  | [optional] 
**redirect_url** | **str** |  | [optional] 
**front_door_boost_uri** | **str** |  | [optional] 
**created_at** | **str** |  | 
**updated_at** | **str** |  | 
**expires_at** | **str** |  | [optional] 
**auto_boosts** | **List[str]** |  | [optional] 
**writers** | [**List[BoostGetBoostRecipients200ResponseInnerToAnyOf3]**](BoostGetBoostRecipients200ResponseInnerToAnyOf3.md) |  | [optional] 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_contract import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_contract_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_dict = credential_get_holder_export_metadata200_response_consent_records_inner_contract_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContract.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_contract_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


