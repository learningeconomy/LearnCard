# ContractsGetTermsTransactionHistoryRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**terms** | [**ContractsGetTermsTransactionHistoryRequestQueryTerms**](ContractsGetTermsTransactionHistoryRequestQueryTerms.md) |  | [optional] 
**action** | [**ContractsGetTermsTransactionHistoryRequestQueryAction**](ContractsGetTermsTransactionHistoryRequestQueryAction.md) |  | [optional] 
**var_date** | [**ContractsGetTermsTransactionHistoryRequestQueryDate**](ContractsGetTermsTransactionHistoryRequestQueryDate.md) |  | [optional] 
**expires_at** | [**ContractsGetTermsTransactionHistoryRequestQueryDate**](ContractsGetTermsTransactionHistoryRequestQueryDate.md) |  | [optional] 
**one_time** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history_request_query import ContractsGetTermsTransactionHistoryRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistoryRequestQuery from a JSON string
contracts_get_terms_transaction_history_request_query_instance = ContractsGetTermsTransactionHistoryRequestQuery.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistoryRequestQuery.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history_request_query_dict = contracts_get_terms_transaction_history_request_query_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistoryRequestQuery from a dict
contracts_get_terms_transaction_history_request_query_from_dict = ContractsGetTermsTransactionHistoryRequestQuery.from_dict(contracts_get_terms_transaction_history_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


