# ContractsAddAutoBoostsToContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract_uri** | **str** |  | 
**autoboosts** | [**List[ContractsCreateConsentFlowContractRequestAutoboostsInner]**](ContractsCreateConsentFlowContractRequestAutoboostsInner.md) |  | 

## Example

```python
from openapi_client.models.contracts_add_auto_boosts_to_contract_request import ContractsAddAutoBoostsToContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsAddAutoBoostsToContractRequest from a JSON string
contracts_add_auto_boosts_to_contract_request_instance = ContractsAddAutoBoostsToContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsAddAutoBoostsToContractRequest.to_json())

# convert the object into a dict
contracts_add_auto_boosts_to_contract_request_dict = contracts_add_auto_boosts_to_contract_request_instance.to_dict()
# create an instance of ContractsAddAutoBoostsToContractRequest from a dict
contracts_add_auto_boosts_to_contract_request_from_dict = ContractsAddAutoBoostsToContractRequest.from_dict(contracts_add_auto_boosts_to_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


