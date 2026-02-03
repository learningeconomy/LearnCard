# ContractsCancelContractRequestRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract_uri** | **str** |  | 
**target_profile_id** | **str** |  | 

## Example

```python
from openapi_client.models.contracts_cancel_contract_request_request import ContractsCancelContractRequestRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsCancelContractRequestRequest from a JSON string
contracts_cancel_contract_request_request_instance = ContractsCancelContractRequestRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsCancelContractRequestRequest.to_json())

# convert the object into a dict
contracts_cancel_contract_request_request_dict = contracts_cancel_contract_request_request_instance.to_dict()
# create an instance of ContractsCancelContractRequestRequest from a dict
contracts_cancel_contract_request_request_from_dict = ContractsCancelContractRequestRequest.from_dict(contracts_cancel_contract_request_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


