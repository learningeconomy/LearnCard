# ContractsCreateConsentFlowContractRequestContractRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsCreateConsentFlowContractRequestContractReadCredentials**](ContractsCreateConsentFlowContractRequestContractReadCredentials.md) |  | [optional] 
**personal** | [**Dict[str, StorageResolve200ResponseAnyOfAnyOfReadCredentialsCategoriesValue]**](StorageResolve200ResponseAnyOfAnyOfReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_create_consent_flow_contract_request_contract_read import ContractsCreateConsentFlowContractRequestContractRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsCreateConsentFlowContractRequestContractRead from a JSON string
contracts_create_consent_flow_contract_request_contract_read_instance = ContractsCreateConsentFlowContractRequestContractRead.from_json(json)
# print the JSON string representation of the object
print(ContractsCreateConsentFlowContractRequestContractRead.to_json())

# convert the object into a dict
contracts_create_consent_flow_contract_request_contract_read_dict = contracts_create_consent_flow_contract_request_contract_read_instance.to_dict()
# create an instance of ContractsCreateConsentFlowContractRequestContractRead from a dict
contracts_create_consent_flow_contract_request_contract_read_from_dict = ContractsCreateConsentFlowContractRequestContractRead.from_dict(contracts_create_consent_flow_contract_request_contract_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


