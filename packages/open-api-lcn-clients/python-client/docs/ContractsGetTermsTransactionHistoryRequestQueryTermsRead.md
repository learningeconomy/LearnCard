# ContractsGetTermsTransactionHistoryRequestQueryTermsRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsGetConsentedContractsRequestQueryReadCredentials**](ContractsGetConsentedContractsRequestQueryReadCredentials.md) |  | [optional] 
**personal** | **Dict[str, str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history_request_query_terms_read import ContractsGetTermsTransactionHistoryRequestQueryTermsRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistoryRequestQueryTermsRead from a JSON string
contracts_get_terms_transaction_history_request_query_terms_read_instance = ContractsGetTermsTransactionHistoryRequestQueryTermsRead.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistoryRequestQueryTermsRead.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history_request_query_terms_read_dict = contracts_get_terms_transaction_history_request_query_terms_read_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistoryRequestQueryTermsRead from a dict
contracts_get_terms_transaction_history_request_query_terms_read_from_dict = ContractsGetTermsTransactionHistoryRequestQueryTermsRead.from_dict(contracts_get_terms_transaction_history_request_query_terms_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


