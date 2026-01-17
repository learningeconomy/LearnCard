# ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentedContracts200ResponseRecordsInnerTermsRead**](ContractsGetConsentedContracts200ResponseRecordsInnerTermsRead.md) |  | 
**write** | [**ContractsGetTermsTransactionHistory200ResponseRecordsInnerTermsWrite**](ContractsGetTermsTransactionHistory200ResponseRecordsInnerTermsWrite.md) |  | 
**denied_writers** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history200_response_records_inner_terms import ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms from a JSON string
contracts_get_terms_transaction_history200_response_records_inner_terms_instance = ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history200_response_records_inner_terms_dict = contracts_get_terms_transaction_history200_response_records_inner_terms_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms from a dict
contracts_get_terms_transaction_history200_response_records_inner_terms_from_dict = ContractsGetTermsTransactionHistory200ResponseRecordsInnerTerms.from_dict(contracts_get_terms_transaction_history200_response_records_inner_terms_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


