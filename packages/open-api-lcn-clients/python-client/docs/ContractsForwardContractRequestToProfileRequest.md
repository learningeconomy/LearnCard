# ContractsForwardContractRequestToProfileRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**parent_profile_id** | **str** |  | 
**target_profile_id** | **str** |  | 
**contract_uri** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_forward_contract_request_to_profile_request import ContractsForwardContractRequestToProfileRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsForwardContractRequestToProfileRequest from a JSON string
contracts_forward_contract_request_to_profile_request_instance = ContractsForwardContractRequestToProfileRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsForwardContractRequestToProfileRequest.to_json())

# convert the object into a dict
contracts_forward_contract_request_to_profile_request_dict = contracts_forward_contract_request_to_profile_request_instance.to_dict()
# create an instance of ContractsForwardContractRequestToProfileRequest from a dict
contracts_forward_contract_request_to_profile_request_from_dict = ContractsForwardContractRequestToProfileRequest.from_dict(contracts_forward_contract_request_to_profile_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


