# ContractsCreateConsentFlowContractRequestContract


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsCreateConsentFlowContractRequestContractRead**](ContractsCreateConsentFlowContractRequestContractRead.md) |  | [optional] 
**write** | [**ContractsCreateConsentFlowContractRequestContractWrite**](ContractsCreateConsentFlowContractRequestContractWrite.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_create_consent_flow_contract_request_contract import ContractsCreateConsentFlowContractRequestContract

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsCreateConsentFlowContractRequestContract from a JSON string
contracts_create_consent_flow_contract_request_contract_instance = ContractsCreateConsentFlowContractRequestContract.from_json(json)
# print the JSON string representation of the object
print(ContractsCreateConsentFlowContractRequestContract.to_json())

# convert the object into a dict
contracts_create_consent_flow_contract_request_contract_dict = contracts_create_consent_flow_contract_request_contract_instance.to_dict()
# create an instance of ContractsCreateConsentFlowContractRequestContract from a dict
contracts_create_consent_flow_contract_request_contract_from_dict = ContractsCreateConsentFlowContractRequestContract.from_dict(contracts_create_consent_flow_contract_request_contract_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


