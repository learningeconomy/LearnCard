# ContractsGetTermsTransactionHistoryRequestQueryTerms


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentedContractsRequestQueryRead**](ContractsGetConsentedContractsRequestQueryRead.md) |  | [optional] 
**write** | [**ContractsGetConsentedContractsRequestQueryWrite**](ContractsGetConsentedContractsRequestQueryWrite.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history_request_query_terms import ContractsGetTermsTransactionHistoryRequestQueryTerms

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistoryRequestQueryTerms from a JSON string
contracts_get_terms_transaction_history_request_query_terms_instance = ContractsGetTermsTransactionHistoryRequestQueryTerms.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistoryRequestQueryTerms.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history_request_query_terms_dict = contracts_get_terms_transaction_history_request_query_terms_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistoryRequestQueryTerms from a dict
contracts_get_terms_transaction_history_request_query_terms_from_dict = ContractsGetTermsTransactionHistoryRequestQueryTerms.from_dict(contracts_get_terms_transaction_history_request_query_terms_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


