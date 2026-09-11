# ContractsGetTermsTransactionHistory200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**expires_at** | **str** |  | [optional] 
**one_time** | **bool** |  | [optional] 
**terms** | [**StorageResolve200ResponseAnyOf1**](StorageResolve200ResponseAnyOf1.md) |  | [optional] 
**id** | **str** |  | 
**action** | **str** |  | 
**var_date** | **str** |  | 
**uris** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history200_response_records_inner import ContractsGetTermsTransactionHistory200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistory200ResponseRecordsInner from a JSON string
contracts_get_terms_transaction_history200_response_records_inner_instance = ContractsGetTermsTransactionHistory200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistory200ResponseRecordsInner.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history200_response_records_inner_dict = contracts_get_terms_transaction_history200_response_records_inner_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistory200ResponseRecordsInner from a dict
contracts_get_terms_transaction_history200_response_records_inner_from_dict = ContractsGetTermsTransactionHistory200ResponseRecordsInner.from_dict(contracts_get_terms_transaction_history200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


