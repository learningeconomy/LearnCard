# ContractsAddAutoBoostsToContractRequestAutoboostsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**signing_authority** | [**ContractsCreateConsentFlowContractRequestAutoboostsInnerSigningAuthority**](ContractsCreateConsentFlowContractRequestAutoboostsInnerSigningAuthority.md) |  | 

## Example

```python
from openapi_client.models.contracts_add_auto_boosts_to_contract_request_autoboosts_inner import ContractsAddAutoBoostsToContractRequestAutoboostsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsAddAutoBoostsToContractRequestAutoboostsInner from a JSON string
contracts_add_auto_boosts_to_contract_request_autoboosts_inner_instance = ContractsAddAutoBoostsToContractRequestAutoboostsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsAddAutoBoostsToContractRequestAutoboostsInner.to_json())

# convert the object into a dict
contracts_add_auto_boosts_to_contract_request_autoboosts_inner_dict = contracts_add_auto_boosts_to_contract_request_autoboosts_inner_instance.to_dict()
# create an instance of ContractsAddAutoBoostsToContractRequestAutoboostsInner from a dict
contracts_add_auto_boosts_to_contract_request_autoboosts_inner_from_dict = ContractsAddAutoBoostsToContractRequestAutoboostsInner.from_dict(contracts_add_auto_boosts_to_contract_request_autoboosts_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


