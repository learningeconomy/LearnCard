# ContractsGetConsentedContracts200ResponseRecordsInnerTerms


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentedContracts200ResponseRecordsInnerTermsRead**](ContractsGetConsentedContracts200ResponseRecordsInnerTermsRead.md) |  | 
**write** | [**StorageResolve200ResponseAnyOf1Write**](StorageResolve200ResponseAnyOf1Write.md) |  | 
**denied_writers** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_contracts200_response_records_inner_terms import ContractsGetConsentedContracts200ResponseRecordsInnerTerms

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedContracts200ResponseRecordsInnerTerms from a JSON string
contracts_get_consented_contracts200_response_records_inner_terms_instance = ContractsGetConsentedContracts200ResponseRecordsInnerTerms.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedContracts200ResponseRecordsInnerTerms.to_json())

# convert the object into a dict
contracts_get_consented_contracts200_response_records_inner_terms_dict = contracts_get_consented_contracts200_response_records_inner_terms_instance.to_dict()
# create an instance of ContractsGetConsentedContracts200ResponseRecordsInnerTerms from a dict
contracts_get_consented_contracts200_response_records_inner_terms_from_dict = ContractsGetConsentedContracts200ResponseRecordsInnerTerms.from_dict(contracts_get_consented_contracts200_response_records_inner_terms_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


