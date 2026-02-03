# ContractsGetConsentFlowContract200ResponseContractRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**StorageResolve200ResponseAnyOfAnyOf1WriteCredentials**](StorageResolve200ResponseAnyOfAnyOf1WriteCredentials.md) |  | 
**personal** | [**Dict[str, StorageResolve200ResponseAnyOfAnyOf1ReadPersonalValue]**](StorageResolve200ResponseAnyOfAnyOf1ReadPersonalValue.md) |  | 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contract200_response_contract_read import ContractsGetConsentFlowContract200ResponseContractRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContract200ResponseContractRead from a JSON string
contracts_get_consent_flow_contract200_response_contract_read_instance = ContractsGetConsentFlowContract200ResponseContractRead.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContract200ResponseContractRead.to_json())

# convert the object into a dict
contracts_get_consent_flow_contract200_response_contract_read_dict = contracts_get_consent_flow_contract200_response_contract_read_instance.to_dict()
# create an instance of ContractsGetConsentFlowContract200ResponseContractRead from a dict
contracts_get_consent_flow_contract200_response_contract_read_from_dict = ContractsGetConsentFlowContract200ResponseContractRead.from_dict(contracts_get_consent_flow_contract200_response_contract_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


