# ContractsUpdateConsentedContractTermsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**terms** | [**StorageResolve200ResponseAnyOf1**](StorageResolve200ResponseAnyOf1.md) |  | 
**expires_at** | **str** |  | [optional] 
**one_time** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_update_consented_contract_terms_request import ContractsUpdateConsentedContractTermsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentedContractTermsRequest from a JSON string
contracts_update_consented_contract_terms_request_instance = ContractsUpdateConsentedContractTermsRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentedContractTermsRequest.to_json())

# convert the object into a dict
contracts_update_consented_contract_terms_request_dict = contracts_update_consented_contract_terms_request_instance.to_dict()
# create an instance of ContractsUpdateConsentedContractTermsRequest from a dict
contracts_update_consented_contract_terms_request_from_dict = ContractsUpdateConsentedContractTermsRequest.from_dict(contracts_update_consented_contract_terms_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


