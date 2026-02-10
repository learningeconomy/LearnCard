# ContractsGetAllContractRequestsForProfile200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract** | [**ContractsGetAllContractRequestsForProfile200ResponseInnerContract**](ContractsGetAllContractRequestsForProfile200ResponseInnerContract.md) |  | 
**profile** | [**BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo**](BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo.md) |  | 
**status** | **str** |  | 
**read_status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_all_contract_requests_for_profile200_response_inner import ContractsGetAllContractRequestsForProfile200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetAllContractRequestsForProfile200ResponseInner from a JSON string
contracts_get_all_contract_requests_for_profile200_response_inner_instance = ContractsGetAllContractRequestsForProfile200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetAllContractRequestsForProfile200ResponseInner.to_json())

# convert the object into a dict
contracts_get_all_contract_requests_for_profile200_response_inner_dict = contracts_get_all_contract_requests_for_profile200_response_inner_instance.to_dict()
# create an instance of ContractsGetAllContractRequestsForProfile200ResponseInner from a dict
contracts_get_all_contract_requests_for_profile200_response_inner_from_dict = ContractsGetAllContractRequestsForProfile200ResponseInner.from_dict(contracts_get_all_contract_requests_for_profile200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


