# ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**share_all** | **bool** |  | [optional] 
**sharing** | **bool** |  | [optional] 
**categories** | [**Dict[str, ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue]**](ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history_request_query_terms_read_credentials import ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials from a JSON string
contracts_get_terms_transaction_history_request_query_terms_read_credentials_instance = ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history_request_query_terms_read_credentials_dict = contracts_get_terms_transaction_history_request_query_terms_read_credentials_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials from a dict
contracts_get_terms_transaction_history_request_query_terms_read_credentials_from_dict = ContractsGetTermsTransactionHistoryRequestQueryTermsReadCredentials.from_dict(contracts_get_terms_transaction_history_request_query_terms_read_credentials_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


