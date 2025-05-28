# ContractsGetTermsTransactionHistoryRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**uri** | **str** |  | 
**query** | [**ContractsGetTermsTransactionHistoryRequestQuery**](ContractsGetTermsTransactionHistoryRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history_request import ContractsGetTermsTransactionHistoryRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistoryRequest from a JSON string
contracts_get_terms_transaction_history_request_instance = ContractsGetTermsTransactionHistoryRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistoryRequest.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history_request_dict = contracts_get_terms_transaction_history_request_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistoryRequest from a dict
contracts_get_terms_transaction_history_request_from_dict = ContractsGetTermsTransactionHistoryRequest.from_dict(contracts_get_terms_transaction_history_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


