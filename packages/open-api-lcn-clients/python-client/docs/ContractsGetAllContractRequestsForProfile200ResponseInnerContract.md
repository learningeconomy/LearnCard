# ContractsGetAllContractRequestsForProfile200ResponseInnerContract


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentFlowContract200ResponseContractRead**](ContractsGetConsentFlowContract200ResponseContractRead.md) |  | 
**write** | [**StorageResolve200ResponseAnyOfAnyOf1Write**](StorageResolve200ResponseAnyOfAnyOf1Write.md) |  | 
**uri** | **str** |  | 

## Example

```python
from openapi_client.models.contracts_get_all_contract_requests_for_profile200_response_inner_contract import ContractsGetAllContractRequestsForProfile200ResponseInnerContract

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetAllContractRequestsForProfile200ResponseInnerContract from a JSON string
contracts_get_all_contract_requests_for_profile200_response_inner_contract_instance = ContractsGetAllContractRequestsForProfile200ResponseInnerContract.from_json(json)
# print the JSON string representation of the object
print(ContractsGetAllContractRequestsForProfile200ResponseInnerContract.to_json())

# convert the object into a dict
contracts_get_all_contract_requests_for_profile200_response_inner_contract_dict = contracts_get_all_contract_requests_for_profile200_response_inner_contract_instance.to_dict()
# create an instance of ContractsGetAllContractRequestsForProfile200ResponseInnerContract from a dict
contracts_get_all_contract_requests_for_profile200_response_inner_contract_from_dict = ContractsGetAllContractRequestsForProfile200ResponseInnerContract.from_dict(contracts_get_all_contract_requests_for_profile200_response_inner_contract_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


