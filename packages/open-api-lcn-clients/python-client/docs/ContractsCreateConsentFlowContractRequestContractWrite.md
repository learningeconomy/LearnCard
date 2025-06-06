# ContractsCreateConsentFlowContractRequestContractWrite


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**ContractsCreateConsentFlowContractRequestContractReadCredentials**](ContractsCreateConsentFlowContractRequestContractReadCredentials.md) |  | [optional] 
**personal** | [**Dict[str, StorageResolve200ResponseAnyOfAnyOfReadCredentialsCategoriesValue]**](StorageResolve200ResponseAnyOfAnyOfReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_create_consent_flow_contract_request_contract_write import ContractsCreateConsentFlowContractRequestContractWrite

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsCreateConsentFlowContractRequestContractWrite from a JSON string
contracts_create_consent_flow_contract_request_contract_write_instance = ContractsCreateConsentFlowContractRequestContractWrite.from_json(json)
# print the JSON string representation of the object
print(ContractsCreateConsentFlowContractRequestContractWrite.to_json())

# convert the object into a dict
contracts_create_consent_flow_contract_request_contract_write_dict = contracts_create_consent_flow_contract_request_contract_write_instance.to_dict()
# create an instance of ContractsCreateConsentFlowContractRequestContractWrite from a dict
contracts_create_consent_flow_contract_request_contract_write_from_dict = ContractsCreateConsentFlowContractRequestContractWrite.from_dict(contracts_create_consent_flow_contract_request_contract_write_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


