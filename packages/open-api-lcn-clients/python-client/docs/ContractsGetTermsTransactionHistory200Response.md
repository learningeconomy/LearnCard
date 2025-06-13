# ContractsGetTermsTransactionHistory200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ContractsGetTermsTransactionHistory200ResponseRecordsInner]**](ContractsGetTermsTransactionHistory200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.contracts_get_terms_transaction_history200_response import ContractsGetTermsTransactionHistory200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetTermsTransactionHistory200Response from a JSON string
contracts_get_terms_transaction_history200_response_instance = ContractsGetTermsTransactionHistory200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetTermsTransactionHistory200Response.to_json())

# convert the object into a dict
contracts_get_terms_transaction_history200_response_dict = contracts_get_terms_transaction_history200_response_instance.to_dict()
# create an instance of ContractsGetTermsTransactionHistory200Response from a dict
contracts_get_terms_transaction_history200_response_from_dict = ContractsGetTermsTransactionHistory200Response.from_dict(contracts_get_terms_transaction_history200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


