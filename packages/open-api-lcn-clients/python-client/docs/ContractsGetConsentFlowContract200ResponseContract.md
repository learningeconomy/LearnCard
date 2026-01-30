# ContractsGetConsentFlowContract200ResponseContract


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentFlowContract200ResponseContractRead**](ContractsGetConsentFlowContract200ResponseContractRead.md) |  | 
**write** | [**StorageResolve200ResponseAnyOfAnyOf1Write**](StorageResolve200ResponseAnyOfAnyOf1Write.md) |  | 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contract200_response_contract import ContractsGetConsentFlowContract200ResponseContract

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContract200ResponseContract from a JSON string
contracts_get_consent_flow_contract200_response_contract_instance = ContractsGetConsentFlowContract200ResponseContract.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContract200ResponseContract.to_json())

# convert the object into a dict
contracts_get_consent_flow_contract200_response_contract_dict = contracts_get_consent_flow_contract200_response_contract_instance.to_dict()
# create an instance of ContractsGetConsentFlowContract200ResponseContract from a dict
contracts_get_consent_flow_contract200_response_contract_from_dict = ContractsGetConsentFlowContract200ResponseContract.from_dict(contracts_get_consent_flow_contract200_response_contract_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


